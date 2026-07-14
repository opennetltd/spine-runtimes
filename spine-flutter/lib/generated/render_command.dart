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
import 'blend_mode.dart';

/// RenderCommand wrapper
class RenderCommand {
  final Pointer<spine_render_command_wrapper> _ptr;

  RenderCommand.fromPointer(this._ptr);

  /// Get the native pointer for FFI calls
  Pointer get nativePtr => _ptr;

  void dispose() {
    SpineBindings.bindings.spine_render_command_dispose(_ptr);
  }

  Pointer<Float>? get positions {
    final result = SpineBindings.bindings.spine_render_command_get_positions(_ptr);
    return result;
  }

  Pointer<Float>? get uvs {
    final result = SpineBindings.bindings.spine_render_command_get_uvs(_ptr);
    return result;
  }

  Pointer<Uint32>? get colors {
    final result = SpineBindings.bindings.spine_render_command_get_colors(_ptr);
    return result;
  }

  Pointer<Uint32>? get darkColors {
    final result = SpineBindings.bindings.spine_render_command_get_dark_colors(_ptr);
    return result;
  }

  int get numVertices {
    final result = SpineBindings.bindings.spine_render_command_get_num_vertices(_ptr);
    return result;
  }

  Pointer<Uint16>? get indices {
    final result = SpineBindings.bindings.spine_render_command_get_indices(_ptr);
    return result;
  }

  int get numIndices {
    final result = SpineBindings.bindings.spine_render_command_get_num_indices(_ptr);
    return result;
  }

  BlendMode get blendMode {
    final result = SpineBindings.bindings.spine_render_command_get_blend_mode(_ptr);
    return BlendMode.fromValue(result);
  }

  Pointer<Void>? get texture {
    final result = SpineBindings.bindings.spine_render_command_get_texture(_ptr);
    return result;
  }

  RenderCommand? get next {
    final result = SpineBindings.bindings.spine_render_command_get_next(_ptr);
    return result.address == 0 ? null : RenderCommand.fromPointer(result);
  }
}
