//
// Spine Runtimes License Agreement
// Last updated April 5, 2025. Replaces all prior versions.
//
// Copyright (c) 2013-2025, Esoteric Software LLC
//
// Integration of the Spine Runtimes into software or otherwise creating
// derivative works of the Spine Runtimes is permitted under the terms and
// conditions of Section 2 of the Spine Editor License Agreement:
// http://esotericsoftware.com/spine-editor-license
//
// Otherwise, it is permitted to integrate the Spine Runtimes into software
// or otherwise create derivative works of the Spine Runtimes (collectively,
// "Products"), provided that each user of the Products must obtain their own
// Spine Editor license and redistribution of the Products in any form must
// include this license and copyright notice.
//
// THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
// BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
// THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

// AUTO GENERATED FILE, DO NOT EDIT.

import 'package:universal_ffi/ffi.dart';
import 'spine_dart_bindings_generated.dart';
import '../spine_bindings.dart';
import 'constraint_timeline.dart';
import 'timeline.dart';

/// Resets a physics constraint when specific animation times are reached.
class PhysicsConstraintResetTimeline extends Timeline implements ConstraintTimeline {
  final Pointer<spine_physics_constraint_reset_timeline_wrapper> _ptr;

  PhysicsConstraintResetTimeline.fromPointer(this._ptr)
      : super.fromPointer(SpineBindings.bindings.spine_physics_constraint_reset_timeline_cast_to_timeline(_ptr));

  /// Get the native pointer for FFI calls
  @override
  Pointer get nativePtr => _ptr;

  /// [constraintIndex] -1 for all physics constraints in the skeleton.
  factory PhysicsConstraintResetTimeline(int frameCount, int constraintIndex) {
    final ptr = SpineBindings.bindings.spine_physics_constraint_reset_timeline_create(frameCount, constraintIndex);
    return PhysicsConstraintResetTimeline.fromPointer(ptr);
  }

  void dispose() {
    SpineBindings.bindings.spine_physics_constraint_reset_timeline_dispose(_ptr);
  }

  @override
  int get constraintIndex {
    final result = SpineBindings.bindings.spine_physics_constraint_reset_timeline_get_constraint_index(_ptr);
    return result;
  }

  @override
  set constraintIndex(int value) {
    SpineBindings.bindings.spine_physics_constraint_reset_timeline_set_constraint_index(_ptr, value);
  }

  /// Sets the time for the specified frame.
  void setFrame(int frame, double time) {
    SpineBindings.bindings.spine_physics_constraint_reset_timeline_set_frame(_ptr, frame, time);
  }
}
