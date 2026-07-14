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
import 'format.dart';
import 'texture_filter.dart';
import 'texture_wrap.dart';

/// AtlasPage wrapper
class AtlasPage {
  final Pointer<spine_atlas_page_wrapper> _ptr;

  AtlasPage.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  factory AtlasPage(String inName) {
    final ptr = SpineBindings.bindings.spine_atlas_page_create(inName.toNativeUtf8().cast<Char>());
    return AtlasPage.fromPointer(ptr);
  }

  void dispose() {
    SpineBindings.bindings.spine_atlas_page_dispose(_ptr);
  }

  String get name {
    final result = SpineBindings.bindings.spine_atlas_page_get_name(_ptr);
    return result.cast<Utf8>().toDartString();
  }

  set name(String value) {
    SpineBindings.bindings.spine_atlas_page_set_name(_ptr, value.toNativeUtf8().cast<Char>());
  }

  String get texturePath {
    final result = SpineBindings.bindings.spine_atlas_page_get_texture_path(_ptr);
    return result.cast<Utf8>().toDartString();
  }

  set texturePath(String value) {
    SpineBindings.bindings.spine_atlas_page_set_texture_path(_ptr, value.toNativeUtf8().cast<Char>());
  }

  Format get format {
    final result = SpineBindings.bindings.spine_atlas_page_get_format(_ptr);
    return Format.fromValue(result);
  }

  set format(Format value) {
    SpineBindings.bindings.spine_atlas_page_set_format(_ptr, value.value);
  }

  TextureFilter get minFilter {
    final result = SpineBindings.bindings.spine_atlas_page_get_min_filter(_ptr);
    return TextureFilter.fromValue(result);
  }

  set minFilter(TextureFilter value) {
    SpineBindings.bindings.spine_atlas_page_set_min_filter(_ptr, value.value);
  }

  TextureFilter get magFilter {
    final result = SpineBindings.bindings.spine_atlas_page_get_mag_filter(_ptr);
    return TextureFilter.fromValue(result);
  }

  set magFilter(TextureFilter value) {
    SpineBindings.bindings.spine_atlas_page_set_mag_filter(_ptr, value.value);
  }

  TextureWrap get uWrap {
    final result = SpineBindings.bindings.spine_atlas_page_get_u_wrap(_ptr);
    return TextureWrap.fromValue(result);
  }

  set uWrap(TextureWrap value) {
    SpineBindings.bindings.spine_atlas_page_set_u_wrap(_ptr, value.value);
  }

  TextureWrap get vWrap {
    final result = SpineBindings.bindings.spine_atlas_page_get_v_wrap(_ptr);
    return TextureWrap.fromValue(result);
  }

  set vWrap(TextureWrap value) {
    SpineBindings.bindings.spine_atlas_page_set_v_wrap(_ptr, value.value);
  }

  int get width {
    final result = SpineBindings.bindings.spine_atlas_page_get_width(_ptr);
    return result;
  }

  set width(int value) {
    SpineBindings.bindings.spine_atlas_page_set_width(_ptr, value);
  }

  int get height {
    final result = SpineBindings.bindings.spine_atlas_page_get_height(_ptr);
    return result;
  }

  set height(int value) {
    SpineBindings.bindings.spine_atlas_page_set_height(_ptr, value);
  }

  bool get pma {
    final result = SpineBindings.bindings.spine_atlas_page_get_pma(_ptr);
    return result;
  }

  set pma(bool value) {
    SpineBindings.bindings.spine_atlas_page_set_pma(_ptr, value);
  }

  int get index {
    final result = SpineBindings.bindings.spine_atlas_page_get_index(_ptr);
    return result;
  }

  set index(int value) {
    SpineBindings.bindings.spine_atlas_page_set_index(_ptr, value);
  }

  Pointer<Void>? get texture {
    final result = SpineBindings.bindings.spine_atlas_page_get_texture(_ptr);
    return result;
  }
}
