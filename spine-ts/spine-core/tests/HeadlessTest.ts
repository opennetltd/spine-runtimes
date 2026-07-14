#!/usr/bin/env npx -y tsx

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

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
	AnimationState,
	AnimationStateData,
	AtlasAttachmentLoader,
	Physics,
	Skeleton,
	SkeletonBinary,
	type SkeletonData,
	SkeletonJson,
	TextureAtlas
} from '../src/index.js';

// Printer class for hierarchical output
class Printer {
	private indentLevel = 0;
	private readonly INDENT = "  ";

	print (text: string): void {
		const indent = this.INDENT.repeat(this.indentLevel);
		console.log(indent + text);
	}

	indent (): void {
		this.indentLevel++;
	}

	unindent (): void {
		this.indentLevel--;
	}

	printSkeletonData (data: SkeletonData): void {
		this.print("SkeletonData {");
		this.indent();

		this.print(`name: "${data.name || ""}"`);
		this.print(`version: ${data.version ? `"${data.version}"` : "null"}`);
		this.print(`hash: ${data.hash ? `"${data.hash}"` : "null"}`);
		this.print(`x: ${this.formatFloat(data.x)}`);
		this.print(`y: ${this.formatFloat(data.y)}`);
		this.print(`width: ${this.formatFloat(data.width)}`);
		this.print(`height: ${this.formatFloat(data.height)}`);
		this.print(`referenceScale: ${this.formatFloat(data.referenceScale)}`);
		this.print(`fps: ${this.formatFloat(data.fps || 0)}`);
		this.print(`imagesPath: ${data.imagesPath ? `"${data.imagesPath}"` : "null"}`);
		this.print(`audioPath: ${data.audioPath ? `"${data.audioPath}"` : "null"}`);

		// TODO: Add bones, slots, skins, animations, etc. in future expansion

		this.unindent();
		this.print("}");
	}

	printSkeleton (skeleton: Skeleton): void {
		this.print("Skeleton {");
		this.indent();

		this.print(`x: ${this.formatFloat(skeleton.x)}`);
		this.print(`y: ${this.formatFloat(skeleton.y)}`);
		this.print(`scaleX: ${this.formatFloat(skeleton.scaleX)}`);
		this.print(`scaleY: ${this.formatFloat(skeleton.scaleY)}`);
		this.print(`time: ${this.formatFloat(skeleton.time)}`);

		// TODO: Add runtime state (bones, slots, etc.) in future expansion

		this.unindent();
		this.print("}");
	}

	private formatFloat (value: number): string {
		// Format to 6 decimal places, matching Java/C++ output
		return value.toFixed(6).replace(',', '.');
	}
}

async function main (args: string[]): Promise<void> {
	if (args.length < 2) {
		console.error("Usage: DebugPrinter <skeleton-path> <atlas-path> [animation-name]");
		process.exit(1);
	}

	const skeletonPath = args[0];
	const atlasPath = args[1];
	const animationName = args.length >= 3 ? args[2] : null;

	try {
		// Load atlas
		const atlasData = await fs.readFile(atlasPath, 'utf8');
		const atlas = new TextureAtlas(atlasData);

		// Load skeleton data
		const skeletonData = await loadSkeletonData(skeletonPath, atlas);

		// Print skeleton data
		const printer = new Printer();
		console.log("=== SKELETON DATA ===");
		printer.printSkeletonData(skeletonData);

		// Create skeleton and animation state
		const skeleton = new Skeleton(skeletonData);
		const stateData = new AnimationStateData(skeletonData);
		const state = new AnimationState(stateData);

		skeleton.setupPose();

		// Set animation or setup pose
		if (animationName) {
			// Find and set animation
			const animation = skeletonData.findAnimation(animationName);
			if (!animation) {
				console.error(`Animation not found: ${animationName}`);
				process.exit(1);
			}
			state.setAnimation(0, animationName, true);
			// Update and apply
			state.update(0.016);
			state.apply(skeleton);
		}

		skeleton.updateWorldTransform(Physics.update);

		// Print skeleton state
		console.log("\n=== SKELETON STATE ===");
		printer.printSkeleton(skeleton);

	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

async function loadSkeletonData (skeletonPath: string, atlas: TextureAtlas): Promise<SkeletonData> {
	const attachmentLoader = new AtlasAttachmentLoader(atlas);
	const ext = path.extname(skeletonPath).toLowerCase();

	if (ext === '.json') {
		const jsonData = await fs.readFile(skeletonPath, 'utf8');
		const json = new SkeletonJson(attachmentLoader);
		json.scale = 1;
		const skeletonData = json.readSkeletonData(jsonData);

		// Set name from filename if not already set
		if (!skeletonData.name) {
			const basename = path.basename(skeletonPath);
			const nameWithoutExt = basename.substring(0, basename.lastIndexOf('.')) || basename;
			skeletonData.name = nameWithoutExt;
		}

		return skeletonData;
	} else if (ext === '.skel') {
		const binaryData = await fs.readFile(skeletonPath);
		const binary = new SkeletonBinary(attachmentLoader);
		binary.scale = 1;
		const skeletonData = binary.readSkeletonData(new Uint8Array(binaryData));

		// Set name from filename if not already set
		if (!skeletonData.name) {
			const basename = path.basename(skeletonPath);
			const nameWithoutExt = basename.substring(0, basename.lastIndexOf('.')) || basename;
			skeletonData.name = nameWithoutExt;
		}

		return skeletonData;
	} else {
		throw new Error(`Unsupported skeleton file format: ${ext}`);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main(process.argv.slice(2));
}