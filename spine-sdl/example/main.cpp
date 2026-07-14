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

#include <spine-sdl-cpp.h>
#include <SDL.h>
#include <stdio.h>
#undef main

using namespace spine;

int main() {
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

	// Load atlas and skeleton data
	SDLTextureLoader textureLoader(renderer);
	Atlas atlas("data/spineboy-pma.atlas", &textureLoader);
	SkeletonJson json(atlas);
	json.setScale(0.5f);
	SkeletonData *skeletonData = json.readSkeletonDataFile("data/spineboy-pro.json");

	if (!skeletonData) {
		printf("Failed to load skeleton data\n");
		return -1;
	}

	// Create skeleton and animation state
	Skeleton skeleton(*skeletonData);
	AnimationStateData animationStateData(*skeletonData);
	animationStateData.setDefaultMix(0.2f);
	AnimationState animationState(animationStateData);

	// Setup skeleton
	skeleton.setPosition(400, 500);
	skeleton.setupPose();
	skeleton.update(0);
	skeleton.updateWorldTransform(Physics_Update);

	// Setup animation
	animationState.setAnimation(0, "portal", false);
	animationState.addAnimation(0, "run", true, 0);

	bool quit = false;
	uint64_t lastFrameTime = SDL_GetPerformanceCounter();

	while (!quit) {
		SDL_Event event;
		while (SDL_PollEvent(&event) != 0) {
			if (event.type == SDL_QUIT) {
				quit = true;
				break;
			}
		}

		SDL_SetRenderDrawColor(renderer, 94, 93, 96, 255);
		SDL_RenderClear(renderer);

		uint64_t now = SDL_GetPerformanceCounter();
		double deltaTime = (now - lastFrameTime) / (double) SDL_GetPerformanceFrequency();
		lastFrameTime = now;

		// Update animation
		animationState.update(deltaTime);
		animationState.apply(skeleton);
		skeleton.update(deltaTime);
		skeleton.updateWorldTransform(Physics_Update);

		// Draw
		SDL_draw(skeleton, renderer, true);

		SDL_RenderPresent(renderer);
	}

	// Cleanup
	delete skeletonData;

	SDL_DestroyRenderer(renderer);
	SDL_DestroyWindow(window);
	SDL_Quit();

	return 0;
}