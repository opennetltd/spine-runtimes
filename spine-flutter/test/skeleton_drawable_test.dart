import 'dart:io';
import 'package:spine_flutter/spine_dart.dart';

void main() async {
  print('Testing SkeletonDrawable and event listeners...');

  // Initialize with debug extension enabled
  await initSpineDart(enableMemoryDebugging: false);

  // Load atlas and skeleton data
  final atlasData = File('../example/assets/spineboy.atlas').readAsStringSync();
  final atlas = loadAtlas(atlasData);
  final skeletonJson = File('../example/assets/spineboy-pro.json').readAsStringSync();
  final skeletonData = loadSkeletonDataJson(atlas, skeletonJson);

  // Create skeleton drawable
  final drawable = SkeletonDrawable(skeletonData);
  print('SkeletonDrawable created successfully');

  // Test skeleton bounds
  print('\nTesting skeleton bounds:');
  final bounds = drawable.skeleton.bounds;
  print('  Initial bounds: $bounds');

  // Set skeleton to pose and update bounds
  drawable.skeleton.setupPose();
  drawable.skeleton.updateWorldTransform(Physics.none);
  final boundsAfterPose = drawable.skeleton.bounds;
  print('  Bounds after setupPose: $boundsAfterPose');

  // Track events
  final events = <String>[];

  // Set global animation state listener
  drawable.animationState.setListener((type, entry, event) {
    final eventName = event?.data.name ?? 'null';
    events.add('State: $type, event: $eventName');
  });

  // Set an animation
  final trackEntry = drawable.animationState.setAnimation(0, 'walk', true);
  print('Set animation: walk');

  // Set track entry specific listener (no drawable needed!)
  print('TrackEntry.animationState: ${trackEntry.animationState}');
  trackEntry.setListener((type, entry, event) {
    final eventName = event?.data.name ?? 'null';
    events.add('TrackEntry: $type, event: $eventName');
  });

  print('TrackEntry listener set for: ${trackEntry.hashCode}');

  // Update several times to trigger events
  print('\nUpdating animation state...');
  for (int i = 0; i < 5; i++) {
    drawable.update(0.016); // ~60fps
  }

  // Print collected events
  print('\nCollected events:');
  for (final event in events) {
    print('  $event');
  }

  // Test switching animations
  print('\nSwitching to run animation...');
  events.clear();
  drawable.animationState.setAnimation(0, 'run', true);

  // Update a few more times
  for (int i = 0; i < 3; i++) {
    drawable.update(0.016);
  }

  print('\nEvents after switching:');
  for (final event in events) {
    print('  $event');
  }

  // Test bounds after animation updates
  print('\nTesting bounds after animation:');
  drawable.skeleton.updateWorldTransform(Physics.none);
  final boundsAfterAnimation = drawable.skeleton.bounds;
  print('  Bounds after animation: $boundsAfterAnimation');

  // Test with different animations that might have different bounds
  print('\nTesting bounds with jump animation:');
  drawable.animationState.setAnimation(0, 'jump', false);
  drawable.update(0.5); // Update to middle of jump
  drawable.skeleton.updateWorldTransform(Physics.none);
  final boundsInJump = drawable.skeleton.bounds;
  print('  Bounds during jump: $boundsInJump');

  // Test constraint RTTI
  print('\nTesting constraint RTTI:');

  // IK Constraints
  print('  Constraints:');
  for (final constraint in drawable.skeleton.constraints) {
    final data = constraint?.data;
    print('  Constraint type: ${constraint?.rtti.className}');
    print('  Constraint data type: ${constraint?.data.rtti.className}');
    print('  Constraint name: ${data?.name}');
  }

  // Check manager state before cleanup
  print('\nBefore cleanup:');
  AnimationStateEventManager.instance.debugPrint();

  // Cleanup
  drawable.dispose();
  skeletonData.dispose();
  atlas.dispose();

  // Check manager state after cleanup
  print('\nAfter cleanup:');
  AnimationStateEventManager.instance.debugPrint();

  // Report memory leaks
  reportLeaks();
  print('\nTest complete');
}
