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

/// Color wrapper
class Color {
  final Pointer<spine_color_wrapper> _ptr;

  Color.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  factory Color() {
    final ptr = SpineBindings.bindings.spine_color_create();
    return Color.fromPointer(ptr);
  }

  factory Color.fromRGBA(double r, double g, double b, double a) {
    final ptr = SpineBindings.bindings.spine_color_create2(r, g, b, a);
    return Color.fromPointer(ptr);
  }

  void dispose() {
    SpineBindings.bindings.spine_color_dispose(_ptr);
  }

  Color clamp() {
    final result = SpineBindings.bindings.spine_color_clamp(_ptr);
    return Color.fromPointer(result);
  }

  static double parseHex(String value, int index) {
    final result = SpineBindings.bindings.spine_color_parse_hex(value.toNativeUtf8().cast<Char>(), index);
    return result;
  }

  /// Convert packed RGBA8888 integer to Color
  void rgba8888ToColor(int value) {
    SpineBindings.bindings.spine_color_rgba8888_to_color(_ptr, value);
  }

  /// Convert packed RGB888 integer to Color (no alpha)
  void rgb888ToColor(int value) {
    SpineBindings.bindings.spine_color_rgb888_to_color(_ptr, value);
  }

  double get r {
    final result = SpineBindings.bindings.spine_color_get_r(_ptr);
    return result;
  }

  set r(double value) {
    SpineBindings.bindings.spine_color_set_r(_ptr, value);
  }

  double get g {
    final result = SpineBindings.bindings.spine_color_get_g(_ptr);
    return result;
  }

  set g(double value) {
    SpineBindings.bindings.spine_color_set_g(_ptr, value);
  }

  double get b {
    final result = SpineBindings.bindings.spine_color_get_b(_ptr);
    return result;
  }

  set b(double value) {
    SpineBindings.bindings.spine_color_set_b(_ptr, value);
  }

  double get a {
    final result = SpineBindings.bindings.spine_color_get_a(_ptr);
    return result;
  }

  set a(double value) {
    SpineBindings.bindings.spine_color_set_a(_ptr, value);
  }

  Color set(double r, double g, double b, double a) {
    final result = SpineBindings.bindings.spine_color_set_1(_ptr, r, g, b, a);
    return Color.fromPointer(result);
  }

  Color set2(double r, double g, double b) {
    final result = SpineBindings.bindings.spine_color_set_2(_ptr, r, g, b);
    return Color.fromPointer(result);
  }

  Color set3(Color other) {
    final result = SpineBindings.bindings.spine_color_set_3(_ptr, other.nativePtr.cast());
    return Color.fromPointer(result);
  }

  Color add(double r, double g, double b, double a) {
    final result = SpineBindings.bindings.spine_color_add_1(_ptr, r, g, b, a);
    return Color.fromPointer(result);
  }

  Color add2(double r, double g, double b) {
    final result = SpineBindings.bindings.spine_color_add_2(_ptr, r, g, b);
    return Color.fromPointer(result);
  }

  Color add3(Color other) {
    final result = SpineBindings.bindings.spine_color_add_3(_ptr, other.nativePtr.cast());
    return Color.fromPointer(result);
  }
}
