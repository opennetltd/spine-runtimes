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

#include "spine-sdl-cpp.h"

#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

using namespace spine;

static SkeletonRenderer *skeletonRenderer = nullptr;

static void ensureSkeletonRenderer() {
	if (!skeletonRenderer) {
		skeletonRenderer = new SkeletonRenderer();
	}
}

void spine::SDL_draw(Skeleton &skeleton, SDL_Renderer *renderer, bool premultipliedAlpha) {
	ensureSkeletonRenderer();

	RenderCommand *command = skeletonRenderer->render(skeleton);

	// Pre-allocate vertex and index arrays
	int maxVertices = 1024;
	int maxIndices = 1024 * 3;
	SDL_Vertex *vertices = (SDL_Vertex *) malloc(sizeof(SDL_Vertex) * maxVertices);
	int *indices = (int *) malloc(sizeof(int) * maxIndices);

	while (command) {
		int numVertices = command->numVertices;
		int numIndices = command->numIndices;

		// Resize buffers if needed
		if (numVertices > maxVertices) {
			maxVertices = numVertices * 2;
			vertices = (SDL_Vertex *) realloc(vertices, sizeof(SDL_Vertex) * maxVertices);
		}
		if (numIndices > maxIndices) {
			maxIndices = numIndices * 2;
			indices = (int *) realloc(indices, sizeof(int) * maxIndices);
		}

		// Get vertex data from render command
		float *positions = command->positions;
		float *uvs = command->uvs;
		uint32_t *colors = command->colors;
		uint16_t *commandIndices = command->indices;
		SDL_Texture *texture = (SDL_Texture *) command->texture;
		BlendMode blendMode = command->blendMode;

		// Fill SDL vertices
		for (int i = 0; i < numVertices; i++) {
			vertices[i].position.x = positions[i * 2];
			vertices[i].position.y = positions[i * 2 + 1];
			vertices[i].tex_coord.x = uvs[i * 2];
			vertices[i].tex_coord.y = uvs[i * 2 + 1];

			// Convert color from packed uint32 to SDL_Color
			uint32_t color = colors[i];
			vertices[i].color.r = (color >> 24) & 0xFF;
			vertices[i].color.g = (color >> 16) & 0xFF;
			vertices[i].color.b = (color >> 8) & 0xFF;
			vertices[i].color.a = color & 0xFF;
		}

		// Copy indices
		for (int i = 0; i < numIndices; i++) {
			indices[i] = commandIndices[i];
		}

		// Set blend mode
		if (!premultipliedAlpha) {
			switch (blendMode) {
				case BlendMode_Normal:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_BLEND);
					break;
				case BlendMode_Multiply:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_MOD);
					break;
				case BlendMode_Additive:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_ADD);
					break;
				case BlendMode_Screen:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_BLEND);
					break;
			}
		} else {
			SDL_BlendMode target;
			switch (blendMode) {
				case BlendMode_Normal:
					target = SDL_ComposeCustomBlendMode(SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD,
														SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD);
					SDL_SetTextureBlendMode(texture, target);
					break;
				case BlendMode_Multiply:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_MOD);
					break;
				case BlendMode_Additive:
					target = SDL_ComposeCustomBlendMode(SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE, SDL_BLENDOPERATION_ADD, SDL_BLENDFACTOR_ONE,
														SDL_BLENDFACTOR_ONE, SDL_BLENDOPERATION_ADD);
					SDL_SetTextureBlendMode(texture, target);
					break;
				case BlendMode_Screen:
					target = SDL_ComposeCustomBlendMode(SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD,
														SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD);
					SDL_SetTextureBlendMode(texture, target);
					break;
			}
		}

		// Draw the geometry
		SDL_RenderGeometry(renderer, texture, vertices, numVertices, indices, numIndices);

		// Move to next command
		RenderCommand *next = command->next;
		command = next;
	}

	free(vertices);
	free(indices);
}

void SDLTextureLoader::load(AtlasPage &page, const String &path) {
	int width, height, components;
	stbi_uc *imageData = stbi_load(path.buffer(), &width, &height, &components, 4);
	if (!imageData) return;

	SDL_Texture *texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_ABGR8888, SDL_TEXTUREACCESS_STATIC, width, height);
	if (!texture) {
		stbi_image_free(imageData);
		return;
	}

	if (SDL_UpdateTexture(texture, NULL, imageData, width * 4)) {
		SDL_DestroyTexture(texture);
		stbi_image_free(imageData);
		return;
	}

	stbi_image_free(imageData);
	page.texture = texture;
	page.width = width;
	page.height = height;
}

void SDLTextureLoader::unload(void *texture) {
	SDL_DestroyTexture((SDL_Texture *) texture);
}

// Default extension implementation for spine-cpp
spine::SpineExtension *spine::getDefaultExtension() {
	return new spine::DefaultSpineExtension();
}