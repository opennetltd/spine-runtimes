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

/// TextureRegion wrapper
class TextureRegion {
  final Pointer<spine_texture_region_wrapper> _ptr;

  TextureRegion.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  factory TextureRegion() {
    final ptr = SpineBindings.bindings.spine_texture_region_create();
    return TextureRegion.fromPointer(ptr);
  }

  void dispose() {
    SpineBindings.bindings.spine_texture_region_dispose(_ptr);
  }

  Rtti get rtti {
    final result = SpineBindings.bindings.spine_texture_region_get_rtti(_ptr);
    return Rtti.fromPointer(result);
  }

  double get u {
    final result = SpineBindings.bindings.spine_texture_region_get_u(_ptr);
    return result;
  }

  set u(double value) {
    SpineBindings.bindings.spine_texture_region_set_u(_ptr, value);
  }

  double get v {
    final result = SpineBindings.bindings.spine_texture_region_get_v(_ptr);
    return result;
  }

  set v(double value) {
    SpineBindings.bindings.spine_texture_region_set_v(_ptr, value);
  }

  double get u2 {
    final result = SpineBindings.bindings.spine_texture_region_get_u2(_ptr);
    return result;
  }

  set u2(double value) {
    SpineBindings.bindings.spine_texture_region_set_u2(_ptr, value);
  }

  double get v2 {
    final result = SpineBindings.bindings.spine_texture_region_get_v2(_ptr);
    return result;
  }

  set v2(double value) {
    SpineBindings.bindings.spine_texture_region_set_v2(_ptr, value);
  }

  int get regionWidth {
    final result = SpineBindings.bindings.spine_texture_region_get_region_width(_ptr);
    return result;
  }

  set regionWidth(int value) {
    SpineBindings.bindings.spine_texture_region_set_region_width(_ptr, value);
  }

  int get regionHeight {
    final result = SpineBindings.bindings.spine_texture_region_get_region_height(_ptr);
    return result;
  }

  set regionHeight(int value) {
    SpineBindings.bindings.spine_texture_region_set_region_height(_ptr, value);
  }

  Pointer<Void>? get rendererObject {
    final result = SpineBindings.bindings.spine_texture_region_get_renderer_object(_ptr);
    return result;
  }

  static Rtti rttiStatic() {
    final result = SpineBindings.bindings.spine_texture_region_rtti();
    return Rtti.fromPointer(result);
  }
}
