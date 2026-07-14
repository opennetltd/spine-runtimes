package;

import spine.*;
import spine.atlas.TextureAtlas;
import spine.atlas.TextureAtlasPage;
import spine.atlas.TextureLoader;
import spine.attachments.AtlasAttachmentLoader;
import spine.animation.*;
import spine.utils.SkeletonSerializer;
import sys.io.File;
import haxe.io.Bytes;

// Mock texture loader that doesn't require actual texture loading
class MockTextureLoader implements TextureLoader {
	public function new() {}

	public function loadPage(page:TextureAtlasPage, path:String):Void {
		// Set mock dimensions - no actual texture loading needed
		page.width = 1024;
		page.height = 1024;
		page.texture = {}; // Empty object as mock texture
	}

	public function loadRegion(region:spine.atlas.TextureAtlasRegion):Void {
		// Nothing to do in headless mode
	}

	public function unloadPage(page:TextureAtlasPage):Void {
		// Nothing to unload in headless mode
	}
}

class HeadlessTest {
	static function main():Void {
		var args = Sys.args();

		if (args.length < 2) {
			Sys.stderr().writeString("Usage: HeadlessTest <skeleton-path> <atlas-path> [animation-name]\n");
			Sys.exit(1);
		}

		var skeletonPath = args[0];
		var atlasPath = args[1];
		var animationName = args.length >= 3 ? args[2] : null;

		try {
			// Load atlas with mock texture loader
			var textureLoader = new MockTextureLoader();
			var atlasContent = File.getContent(atlasPath);
			var atlas = new TextureAtlas(atlasContent, textureLoader);

			// Load skeleton data
			var skeletonData:SkeletonData;
			var attachmentLoader = new AtlasAttachmentLoader(atlas);

			if (StringTools.endsWith(skeletonPath, ".json")) {
				var loader = new SkeletonJson(attachmentLoader);
				var jsonContent = File.getContent(skeletonPath);
				skeletonData = loader.readSkeletonData(jsonContent);
			} else {
				var loader = new SkeletonBinary(attachmentLoader);
				var binaryContent = File.getBytes(skeletonPath);
				skeletonData = loader.readSkeletonData(binaryContent);
			}

			// Create serializer
			var serializer = new SkeletonSerializer();

			// Print skeleton data
			Sys.println("=== SKELETON DATA ===");
			Sys.println(serializer.serializeSkeletonData(skeletonData));

			// Create skeleton instance
			var skeleton = new Skeleton(skeletonData);

			// Handle animation if provided
			var state:AnimationState = null;
			if (animationName != null) {
				var stateData = new AnimationStateData(skeletonData);
				state = new AnimationState(stateData);

				var animation = skeletonData.findAnimation(animationName);
				if (animation == null) {
					Sys.stderr().writeString('Animation not found: $animationName\n');
					Sys.exit(1);
				}

				state.setAnimation(0, animation, true);
				state.update(0.016);
				state.apply(skeleton);
			}

			// Update world transforms (following the pattern from other HeadlessTests)
			skeleton.updateWorldTransform(Physics.update);

			// Print skeleton state
			Sys.println("\n=== SKELETON STATE ===");
			try {
				Sys.println(serializer.serializeSkeleton(skeleton));
			} catch (e:Dynamic) {
				Sys.stderr().writeString('Error serializing skeleton: $e\n');
				Sys.stderr().writeString(haxe.CallStack.toString(haxe.CallStack.exceptionStack()) + '\n');
				throw e;
			}

			// Print animation state if present
			if (state != null) {
				Sys.println("\n=== ANIMATION STATE ===");
				Sys.println(serializer.serializeAnimationState(state));
			}
		} catch (e:Dynamic) {
			Sys.stderr().writeString('Error: $e\n');
			Sys.exit(1);
		}
	}
}
