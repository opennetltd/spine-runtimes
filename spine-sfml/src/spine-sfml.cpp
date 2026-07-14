/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated April 5, 2025. Replaces all prior versions.
 *
 * Copyright (c) 2013-2025, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

#include "spine-sfml.h"
#include <spine/Extension.h>

namespace spine {

static SkeletonRenderer *renderer = nullptr;

static void ensureRenderer() {
    if (!renderer) {
        renderer = new SkeletonRenderer();
    }
}

static sf::BlendMode getSFMLBlendMode(BlendMode blendMode, bool premultipliedAlpha) {
    switch (blendMode) {
        case BlendMode_Normal:
            if (premultipliedAlpha) {
                return sf::BlendMode(sf::BlendMode::One, sf::BlendMode::OneMinusSrcAlpha);
            } else {
                return sf::BlendAlpha;
            }
        case BlendMode_Additive:
            if (premultipliedAlpha) {
                return sf::BlendMode(sf::BlendMode::One, sf::BlendMode::One);
            } else {
                return sf::BlendAdd;
            }
        case BlendMode_Multiply:
            return sf::BlendMode(sf::BlendMode::DstColor, sf::BlendMode::OneMinusSrcAlpha);
        case BlendMode_Screen:
            return sf::BlendMode(sf::BlendMode::One, sf::BlendMode::OneMinusSrcColor);
        default:
            return sf::BlendAlpha;
    }
}

void SFML_draw(Skeleton &skeleton, sf::RenderWindow &window, bool premultipliedAlpha) {
    ensureRenderer();

    // Create vertex array for current draw
    sf::VertexArray vertices(sf::Triangles);

    // Render the skeleton
    RenderCommand* command = renderer->render(skeleton);

    while (command) {
        float* positions = command->positions;
        float* uvs = command->uvs;
        uint32_t* colors = command->colors;
        int numVertices = command->numVertices;
        uint16_t* indices = command->indices;
        int numIndices = command->numIndices;
        BlendMode blendMode = command->blendMode;
        void* textureHandle = command->texture;

        if (textureHandle && numVertices > 0) {
            sf::Texture* sfTexture = static_cast<sf::Texture*>(textureHandle);
            sf::Vector2u textureSize = sfTexture->getSize();

            // Clear vertex array for this draw call
            vertices.clear();

            // Convert vertices
            for (int i = 0; i < numIndices; i++) {
                int idx = indices[i];
                sf::Vertex vertex;

                // Position
                vertex.position.x = positions[idx * 2];
                vertex.position.y = positions[idx * 2 + 1];

                // Texture coordinates
                vertex.texCoords.x = uvs[idx * 2] * textureSize.x;
                vertex.texCoords.y = uvs[idx * 2 + 1] * textureSize.y;

                // Color
                uint8_t r = (colors[idx] >> 24) & 0xFF;
                uint8_t g = (colors[idx] >> 16) & 0xFF;
                uint8_t b = (colors[idx] >> 8) & 0xFF;
                uint8_t a = colors[idx] & 0xFF;
                vertex.color = sf::Color(r, g, b, a);

                vertices.append(vertex);
            }

            // Create render states
            sf::RenderStates states;
            states.texture = sfTexture;
            states.blendMode = getSFMLBlendMode(blendMode, premultipliedAlpha);

            // Draw
            window.draw(vertices, states);
        }

        // Move to next command
        RenderCommand* next = command->next;
        command = next;
    }
}

void SFMLTextureLoader::load(AtlasPage &page, const String &path) {
    sf::Texture *texture = new sf::Texture();
    if (!texture->loadFromFile(path.buffer())) {
        delete texture;
        return;
    }

    // Configure texture based on atlas page settings
    if (page.magFilter == TextureFilter_Linear) {
        texture->setSmooth(true);
    } else {
        texture->setSmooth(false);
    }

    switch (page.uWrap) {
        case TextureWrap_ClampToEdge:
            texture->setRepeated(false);
            break;
        case TextureWrap_Repeat:
            texture->setRepeated(true);
            break;
        default:
            texture->setRepeated(false);
    }

    page.texture = texture;
    page.width = texture->getSize().x;
    page.height = texture->getSize().y;
}

void SFMLTextureLoader::unload(void *texture) {
    delete static_cast<sf::Texture*>(texture);
}

} // namespace spine

// Extension support
spine::SpineExtension* spine::getDefaultExtension() {
    return new spine::DefaultSpineExtension();
}