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

#include <spine-sdl-c.h>
#include <SDL.h>
#include <stdio.h>
#include <stdlib.h>
#undef main

// Global renderer for texture loading callbacks
static SDL_Renderer *g_renderer = NULL;

// Texture loading callback for atlas
void *load_texture_callback(const char *path) {
	extern void *load_texture(const char *path, SDL_Renderer *renderer);
	return load_texture(path, g_renderer);
}

void unload_texture_callback(void *texture) {
	SDL_DestroyTexture((SDL_Texture *) texture);
}

char *read_file(const char *path, int *length) {
	FILE *file = fopen(path, "rb");
	if (!file) return NULL;

	fseek(file, 0, SEEK_END);
	*length = (int) ftell(file);
	fseek(file, 0, SEEK_SET);

	char *data = (char *) malloc(*length + 1);
	fread(data, 1, *length, file);
	data[*length] = '\0';
	fclose(file);

	return data;
}

int main(void) {
	if (SDL_Init(SDL_INIT_VIDEO)) {
		printf("Error: %s\n", SDL_GetError());
		return -1;
	}

	SDL_Window *window = SDL_CreateWindow("Spine SDL", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, 800, 600, 0);
	if (!window) {
		printf("Error: %s\n", SDL_GetError());
		return -1;
	}

	SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
	if (!renderer) {
		printf("Error: %s\n", SDL_GetError());
		return -1;
	}

	// Set global renderer for texture loading
	g_renderer = renderer;

	// Load atlas
	int atlas_length;
	char *atlas_data = read_file("data/spineboy-pma.atlas", &atlas_length);
	if (!atlas_data) {
		printf("Failed to load atlas\n");
		return -1;
	}

	spine_atlas_result atlas_result = spine_atlas_load_callback(atlas_data, "data/", load_texture_callback, unload_texture_callback);
	spine_atlas atlas = spine_atlas_result_get_atlas(atlas_result);
	free(atlas_data);

	if (!atlas) {
		const char *error = spine_atlas_result_get_error(atlas_result);
		printf("Failed to load atlas: %s\n", error);
		spine_atlas_result_dispose(atlas_result);
		return -1;
	}

	// Load skeleton
	int skeleton_length;
	char *skeleton_data = read_file("data/spineboy-pro.json", &skeleton_length);
	if (!skeleton_data) {
		printf("Failed to load skeleton\n");
		return -1;
	}

	spine_skeleton_data_result skeleton_result = spine_skeleton_data_load_json(atlas, skeleton_data, "data/");
	spine_skeleton_data skeleton_data_handle = spine_skeleton_data_result_get_data(skeleton_result);
	free(skeleton_data);

	if (!skeleton_data_handle) {
		const char *error = spine_skeleton_data_result_get_error(skeleton_result);
		printf("Failed to load skeleton: %s\n", error);
		spine_skeleton_data_result_dispose(skeleton_result);
		return -1;
	}

	// Create drawable
	spine_skeleton_drawable drawable = spine_skeleton_drawable_create(skeleton_data_handle);
	spine_skeleton skeleton = spine_skeleton_drawable_get_skeleton(drawable);
	spine_animation_state animation_state = spine_skeleton_drawable_get_animation_state(drawable);
	spine_animation_state_data animation_state_data = spine_skeleton_drawable_get_animation_state_data(drawable);

	// Setup skeleton
	spine_skeleton_set_position(skeleton, 400, 500);
	spine_skeleton_set_scale(skeleton, 0.5f, 0.5f);
	spine_skeleton_setup_pose(skeleton);
	spine_skeleton_update(skeleton, 0);
	spine_skeleton_update_world_transform(skeleton, SPINE_PHYSICS_UPDATE);

	// Setup animation
	spine_animation_state_data_set_default_mix(animation_state_data, 0.2f);
	spine_animation_state_set_animation_1(animation_state, 0, "portal", false);
	spine_animation_state_add_animation_1(animation_state, 0, "run", true, 0);

	int quit = 0;
	uint64_t lastFrameTime = SDL_GetPerformanceCounter();

	while (!quit) {
		SDL_Event event;
		while (SDL_PollEvent(&event) != 0) {
			if (event.type == SDL_QUIT) {
				quit = 1;
				break;
			}
		}

		SDL_SetRenderDrawColor(renderer, 94, 93, 96, 255);
		SDL_RenderClear(renderer);

		uint64_t now = SDL_GetPerformanceCounter();
		double deltaTime = (now - lastFrameTime) / (double) SDL_GetPerformanceFrequency();
		lastFrameTime = now;

		// Update animation
		spine_skeleton_drawable_update(drawable, (float) deltaTime);

		// Draw
		spine_sdl_draw(drawable, renderer, true);

		SDL_RenderPresent(renderer);
	}

	// Cleanup
	spine_skeleton_drawable_dispose(drawable);
	spine_skeleton_data_result_dispose(skeleton_result);
	spine_atlas_result_dispose(atlas_result);

	SDL_DestroyRenderer(renderer);
	SDL_DestroyWindow(window);
	SDL_Quit();

	return 0;
}
