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

#include "spine-sdl-c.h"
#include <stdlib.h>

#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

static spine_skeleton_renderer renderer = NULL;

static void ensure_renderer(void) {
	if (!renderer) {
		renderer = spine_skeleton_renderer_create();
	}
}

void spine_sdl_draw(spine_skeleton_drawable drawable, struct SDL_Renderer *sdl_renderer, bool premultipliedAlpha) {
	spine_skeleton skeleton = spine_skeleton_drawable_get_skeleton(drawable);
	spine_sdl_draw_skeleton(skeleton, sdl_renderer, premultipliedAlpha);
}

void spine_sdl_draw_skeleton(spine_skeleton skeleton, struct SDL_Renderer *sdl_renderer, bool premultipliedAlpha) {
	ensure_renderer();

	spine_render_command command = spine_skeleton_renderer_render(renderer, skeleton);

	// Pre-allocate vertex and index arrays
	int max_vertices = 1024;
	int max_indices = 1024 * 3;
	SDL_Vertex *vertices = (SDL_Vertex *) malloc(sizeof(SDL_Vertex) * max_vertices);
	int *indices = (int *) malloc(sizeof(int) * max_indices);

	while (command) {
		int num_vertices = spine_render_command_get_num_vertices(command);
		int num_indices = spine_render_command_get_num_indices(command);

		// Resize buffers if needed
		if (num_vertices > max_vertices) {
			max_vertices = num_vertices * 2;
			vertices = (SDL_Vertex *) realloc(vertices, sizeof(SDL_Vertex) * max_vertices);
		}
		if (num_indices > max_indices) {
			max_indices = num_indices * 2;
			indices = (int *) realloc(indices, sizeof(int) * max_indices);
		}

		// Get vertex data from render command
		float *positions = spine_render_command_get_positions(command);
		float *uvs = spine_render_command_get_uvs(command);
		uint32_t *colors = spine_render_command_get_colors(command);
		uint16_t *command_indices = spine_render_command_get_indices(command);
		SDL_Texture *texture = (SDL_Texture *) spine_render_command_get_texture(command);
		spine_blend_mode blend_mode = spine_render_command_get_blend_mode(command);

		// Fill SDL vertices
		for (int i = 0; i < num_vertices; i++) {
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
		for (int i = 0; i < num_indices; i++) {
			indices[i] = command_indices[i];
		}

		// Set blend mode
		if (!premultipliedAlpha) {
			switch (blend_mode) {
				case SPINE_BLEND_MODE_NORMAL:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_BLEND);
					break;
				case SPINE_BLEND_MODE_MULTIPLY:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_MOD);
					break;
				case SPINE_BLEND_MODE_ADDITIVE:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_ADD);
					break;
				case SPINE_BLEND_MODE_SCREEN:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_BLEND);
					break;
			}
		} else {
			SDL_BlendMode target;
			switch (blend_mode) {
				case SPINE_BLEND_MODE_NORMAL:
					target = SDL_ComposeCustomBlendMode(SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD,
														SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD);
					SDL_SetTextureBlendMode(texture, target);
					break;
				case SPINE_BLEND_MODE_MULTIPLY:
					SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_MOD);
					break;
				case SPINE_BLEND_MODE_ADDITIVE:
					target = SDL_ComposeCustomBlendMode(SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE, SDL_BLENDOPERATION_ADD, SDL_BLENDFACTOR_ONE,
														SDL_BLENDFACTOR_ONE, SDL_BLENDOPERATION_ADD);
					SDL_SetTextureBlendMode(texture, target);
					break;
				case SPINE_BLEND_MODE_SCREEN:
					target = SDL_ComposeCustomBlendMode(SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD,
														SDL_BLENDFACTOR_ONE, SDL_BLENDFACTOR_ONE_MINUS_SRC_ALPHA, SDL_BLENDOPERATION_ADD);
					SDL_SetTextureBlendMode(texture, target);
					break;
			}
		}

		// Draw the geometry
		SDL_RenderGeometry(sdl_renderer, texture, vertices, num_vertices, indices, num_indices);

		// Move to next command
		spine_render_command next = spine_render_command_get_next(command);
		command = next;
	}

	free(vertices);
	free(indices);
}

// Texture loading functions for atlas
void *load_texture(const char *path, SDL_Renderer *renderer) {
	int width, height, components;
	stbi_uc *imageData = stbi_load(path, &width, &height, &components, 4);
	if (!imageData) return NULL;

	SDL_Texture *texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_ABGR8888, SDL_TEXTUREACCESS_STATIC, width, height);
	if (!texture) {
		stbi_image_free(imageData);
		return NULL;
	}

	if (SDL_UpdateTexture(texture, NULL, imageData, width * 4)) {
		SDL_DestroyTexture(texture);
		stbi_image_free(imageData);
		return NULL;
	}

	stbi_image_free(imageData);
	return texture;
}

void unload_texture(void *texture) {
	SDL_DestroyTexture((SDL_Texture *) texture);
}
