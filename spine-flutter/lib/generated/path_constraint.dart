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
import 'arrays.dart';
import 'path_constraint_base.dart';
import 'path_constraint_data.dart';
import 'skeleton.dart';
import 'slot.dart';

/// PathConstraint wrapper
class PathConstraint extends PathConstraintBase {
  final Pointer<spine_path_constraint_wrapper> _ptr;

  PathConstraint.fromPointer(this._ptr)
      : super.fromPointer(SpineBindings.bindings.spine_path_constraint_cast_to_path_constraint_base(_ptr));

  /// Get the native pointer for FFI calls
  @override
  Pointer get nativePtr => _ptr;

  factory PathConstraint(PathConstraintData data, Skeleton skeleton) {
    final ptr = SpineBindings.bindings.spine_path_constraint_create(data.nativePtr.cast(), skeleton.nativePtr.cast());
    return PathConstraint.fromPointer(ptr);
  }

  @override
  void dispose() {
    SpineBindings.bindings.spine_path_constraint_dispose(_ptr);
  }

  PathConstraint copy(Skeleton skeleton) {
    final result = SpineBindings.bindings.spine_path_constraint_copy(_ptr, skeleton.nativePtr.cast());
    return PathConstraint.fromPointer(result);
  }

  /// The bones that will be modified by this path constraint.
  ArrayBonePose get bones {
    final result = SpineBindings.bindings.spine_path_constraint_get_bones(_ptr);
    return ArrayBonePose.fromPointer(result);
  }

  /// The slot whose path attachment will be used to constrained the bones.
  Slot get slot {
    final result = SpineBindings.bindings.spine_path_constraint_get_slot(_ptr);
    return Slot.fromPointer(result);
  }

  set slot(Slot value) {
    SpineBindings.bindings.spine_path_constraint_set_slot(_ptr, value.nativePtr.cast());
  }
}
