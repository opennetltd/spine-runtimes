import 'dart:io';
import 'package:spine_flutter/spine_dart.dart';

void main() async {
  print('Testing atlas and skeleton data loading...');

  // Initialize with debug extension enabled
  await initSpineDart(enableMemoryDebugging: true);

  // Load atlas
  final atlasData = File('../example/assets/spineboy.atlas').readAsStringSync();
  final atlas = loadAtlas(atlasData);

  print('Atlas loaded successfully');
  print('Number of regions: ${atlas.regions.length}');

  // Load skeleton data
  final skeletonJson = File('../example/assets/spineboy-pro.json').readAsStringSync();
  final skeletonData = loadSkeletonDataJson(atlas, skeletonJson);

  print('Skeleton data loaded successfully');
  print('Number of bones: ${skeletonData.bones.length}');
  print('Number of slots: ${skeletonData.slots.length}');
  print('Number of animations: ${skeletonData.animations.length}');

  final skeleton = Skeleton(skeletonData);
  print('Skeleton created successfully');
  print('Skeleton has ${skeleton.slots.length} slots and ${skeleton.bones.length} bones');

  // Test skin entries
  print('\nTesting skin entries...');
  final defaultSkin = skeletonData.defaultSkin;
  if (defaultSkin != null) {
    final entries = defaultSkin.getEntries();
    print('Default skin has ${entries.length} entries');

    // Print first few entries
    for (int i = 0; i < 5 && i < entries.length; i++) {
      final entry = entries[i];
      print('  Entry $i: slot=${entry.slotIndex}, name="${entry.name}", attachment=${entry.attachment?.runtimeType}');
    }
  }

  // Test named skins
  print('\nChecking named skins...');
  for (int i = 0; i < skeletonData.skins.length; i++) {
    final skin = skeletonData.skins[i];
    if (skin != null) {
      final entries = skin.getEntries();
      print('Skin "${skin.name}" has ${entries.length} entries');
    }
  }

  // Cleanup
  skeleton.dispose();
  skeletonData.dispose();
  atlas.dispose();

  // Report memory leaks
  reportLeaks();
  print('Test complete');
}
