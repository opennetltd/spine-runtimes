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
import 'clipping_attachment.dart';
import 'skeleton.dart';
import 'slot.dart';

/// SkeletonClipping wrapper
class SkeletonClipping {
  final Pointer<spine_skeleton_clipping_wrapper> _ptr;

  SkeletonClipping.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  factory SkeletonClipping() {
    final ptr = SpineBindings.bindings.spine_skeleton_clipping_create();
    return SkeletonClipping.fromPointer(ptr);
  }

  void dispose() {
    SpineBindings.bindings.spine_skeleton_clipping_dispose(_ptr);
  }

  int clipStart(Skeleton skeleton, Slot slot, ClippingAttachment? clip) {
    final result = SpineBindings.bindings.spine_skeleton_clipping_clip_start(
        _ptr, skeleton.nativePtr.cast(), slot.nativePtr.cast(), clip?.nativePtr.cast() ?? Pointer.fromAddress(0));
    return result;
  }

  bool get isClipping {
    final result = SpineBindings.bindings.spine_skeleton_clipping_is_clipping(_ptr);
    return result;
  }

  ArrayFloat get clippedVertices {
    final result = SpineBindings.bindings.spine_skeleton_clipping_get_clipped_vertices(_ptr);
    return ArrayFloat.fromPointer(result);
  }

  ArrayUnsignedShort get clippedTriangles {
    final result = SpineBindings.bindings.spine_skeleton_clipping_get_clipped_triangles(_ptr);
    return ArrayUnsignedShort.fromPointer(result);
  }

  ArrayFloat get clippedUVs {
    final result = SpineBindings.bindings.spine_skeleton_clipping_get_clipped_u_vs(_ptr);
    return ArrayFloat.fromPointer(result);
  }

  void clipEnd(Slot slot) {
    SpineBindings.bindings.spine_skeleton_clipping_clip_end_1(_ptr, slot.nativePtr.cast());
  }

  void clipEnd2() {
    SpineBindings.bindings.spine_skeleton_clipping_clip_end_2(_ptr);
  }

  bool clipTriangles(ArrayFloat vertices, ArrayUnsignedShort triangles, ArrayFloat uvs, int stride) {
    final result = SpineBindings.bindings.spine_skeleton_clipping_clip_triangles_3(
        _ptr, vertices.nativePtr.cast(), triangles.nativePtr.cast(), uvs.nativePtr.cast(), stride);
    return result;
  }
}
