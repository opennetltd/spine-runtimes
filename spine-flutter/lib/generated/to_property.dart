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
import 'rtti.dart';
import 'bone_pose.dart';
import 'skeleton.dart';
import 'transform_constraint_pose.dart';

/// Constrained property for a TransformConstraint.
abstract class ToProperty {
  final Pointer<spine_to_property_wrapper> _ptr;

  ToProperty.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  Rtti get rtti {
    final result = SpineBindings.bindings.spine_to_property_get_rtti(_ptr);
    return Rtti.fromPointer(result);
  }

  /// Reads the mix for this property from the specified pose.
  double mix(TransformConstraintPose pose) {
    final result = SpineBindings.bindings.spine_to_property_mix(_ptr, pose.nativePtr.cast());
    return result;
  }

  /// Applies the value to this property.
  void apply(Skeleton skeleton, TransformConstraintPose pose, BonePose bone, double value, bool local, bool additive) {
    SpineBindings.bindings.spine_to_property_apply(
        _ptr, skeleton.nativePtr.cast(), pose.nativePtr.cast(), bone.nativePtr.cast(), value, local, additive);
  }

  static Rtti rttiStatic() {
    final result = SpineBindings.bindings.spine_to_property_rtti();
    return Rtti.fromPointer(result);
  }

  double get offset {
    final result = SpineBindings.bindings.spine_to_property_get__offset(_ptr);
    return result;
  }

  set offset(double value) {
    SpineBindings.bindings.spine_to_property_set__offset(_ptr, value);
  }

  double get max {
    final result = SpineBindings.bindings.spine_to_property_get__max(_ptr);
    return result;
  }

  set max(double value) {
    SpineBindings.bindings.spine_to_property_set__max(_ptr, value);
  }

  double get scale {
    final result = SpineBindings.bindings.spine_to_property_get__scale(_ptr);
    return result;
  }

  set scale(double value) {
    SpineBindings.bindings.spine_to_property_set__scale(_ptr, value);
  }
}
