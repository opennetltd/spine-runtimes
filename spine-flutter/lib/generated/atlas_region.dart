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
import 'package:universal_ffi/ffi_utils.dart';
import 'spine_dart_bindings_generated.dart';
import '../spine_bindings.dart';
import 'arrays.dart';
import 'atlas_page.dart';
import 'texture_region.dart';

/// AtlasRegion wrapper
class AtlasRegion extends TextureRegion {
  final Pointer<spine_atlas_region_wrapper> _ptr;

  AtlasRegion.fromPointer(this._ptr)
      : super.fromPointer(SpineBindings.bindings.spine_atlas_region_cast_to_texture_region(_ptr));

  /// Get the native pointer for FFI calls
  @override
  Pointer get nativePtr => _ptr;

  factory AtlasRegion() {
    final ptr = SpineBindings.bindings.spine_atlas_region_create();
    return AtlasRegion.fromPointer(ptr);
  }

  @override
  void dispose() {
    SpineBindings.bindings.spine_atlas_region_dispose(_ptr);
  }

  AtlasPage? get page {
    final result = SpineBindings.bindings.spine_atlas_region_get_page(_ptr);
    return result.address == 0 ? null : AtlasPage.fromPointer(result);
  }

  String get name {
    final result = SpineBindings.bindings.spine_atlas_region_get_name(_ptr);
    return result.cast<Utf8>().toDartString();
  }

  int get index {
    final result = SpineBindings.bindings.spine_atlas_region_get_index(_ptr);
    return result;
  }

  int get x {
    final result = SpineBindings.bindings.spine_atlas_region_get_x(_ptr);
    return result;
  }

  int get y {
    final result = SpineBindings.bindings.spine_atlas_region_get_y(_ptr);
    return result;
  }

  double get offsetX {
    final result = SpineBindings.bindings.spine_atlas_region_get_offset_x(_ptr);
    return result;
  }

  double get offsetY {
    final result = SpineBindings.bindings.spine_atlas_region_get_offset_y(_ptr);
    return result;
  }

  int get packedWidth {
    final result = SpineBindings.bindings.spine_atlas_region_get_packed_width(_ptr);
    return result;
  }

  int get packedHeight {
    final result = SpineBindings.bindings.spine_atlas_region_get_packed_height(_ptr);
    return result;
  }

  int get originalWidth {
    final result = SpineBindings.bindings.spine_atlas_region_get_original_width(_ptr);
    return result;
  }

  int get originalHeight {
    final result = SpineBindings.bindings.spine_atlas_region_get_original_height(_ptr);
    return result;
  }

  bool get rotate {
    final result = SpineBindings.bindings.spine_atlas_region_get_rotate(_ptr);
    return result;
  }

  int get degrees {
    final result = SpineBindings.bindings.spine_atlas_region_get_degrees(_ptr);
    return result;
  }

  ArrayInt get splits {
    final result = SpineBindings.bindings.spine_atlas_region_get_splits(_ptr);
    return ArrayInt.fromPointer(result);
  }

  ArrayInt get pads {
    final result = SpineBindings.bindings.spine_atlas_region_get_pads(_ptr);
    return ArrayInt.fromPointer(result);
  }

  ArrayFloat get values {
    final result = SpineBindings.bindings.spine_atlas_region_get_values(_ptr);
    return ArrayFloat.fromPointer(result);
  }

  set page(AtlasPage? value) {
    SpineBindings.bindings.spine_atlas_region_set_page(_ptr, value?.nativePtr.cast() ?? Pointer.fromAddress(0));
  }

  set name(String value) {
    SpineBindings.bindings.spine_atlas_region_set_name(_ptr, value.toNativeUtf8().cast<Char>());
  }

  set index(int value) {
    SpineBindings.bindings.spine_atlas_region_set_index(_ptr, value);
  }

  set x(int value) {
    SpineBindings.bindings.spine_atlas_region_set_x(_ptr, value);
  }

  set y(int value) {
    SpineBindings.bindings.spine_atlas_region_set_y(_ptr, value);
  }

  set offsetX(double value) {
    SpineBindings.bindings.spine_atlas_region_set_offset_x(_ptr, value);
  }

  set offsetY(double value) {
    SpineBindings.bindings.spine_atlas_region_set_offset_y(_ptr, value);
  }

  set packedWidth(int value) {
    SpineBindings.bindings.spine_atlas_region_set_packed_width(_ptr, value);
  }

  set packedHeight(int value) {
    SpineBindings.bindings.spine_atlas_region_set_packed_height(_ptr, value);
  }

  set originalWidth(int value) {
    SpineBindings.bindings.spine_atlas_region_set_original_width(_ptr, value);
  }

  set originalHeight(int value) {
    SpineBindings.bindings.spine_atlas_region_set_original_height(_ptr, value);
  }

  set rotate(bool value) {
    SpineBindings.bindings.spine_atlas_region_set_rotate(_ptr, value);
  }

  set degrees(int value) {
    SpineBindings.bindings.spine_atlas_region_set_degrees(_ptr, value);
  }

  set splits(ArrayInt value) {
    SpineBindings.bindings.spine_atlas_region_set_splits(_ptr, value.nativePtr.cast());
  }

  set pads(ArrayInt value) {
    SpineBindings.bindings.spine_atlas_region_set_pads(_ptr, value.nativePtr.cast());
  }

  set values(ArrayFloat value) {
    SpineBindings.bindings.spine_atlas_region_set_values(_ptr, value.nativePtr.cast());
  }
}
