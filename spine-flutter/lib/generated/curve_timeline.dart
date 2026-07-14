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
import 'timeline.dart';

/// Base class for frames that use an interpolation bezier curve.
abstract class CurveTimeline extends Timeline {
  final Pointer<spine_curve_timeline_wrapper> _ptr;

  CurveTimeline.fromPointer(this._ptr)
      : super.fromPointer(SpineBindings.bindings.spine_curve_timeline_cast_to_timeline(_ptr));

  /// Get the native pointer for FFI calls
  @override
  Pointer get nativePtr => _ptr;

  set linear(int value) {
    SpineBindings.bindings.spine_curve_timeline_set_linear(_ptr, value);
  }

  set stepped(int value) {
    SpineBindings.bindings.spine_curve_timeline_set_stepped(_ptr, value);
  }

  void setBezier(int bezier, int frame, double value, double time1, double value1, double cx1, double cy1, double cx2,
      double cy2, double time2, double value2) {
    SpineBindings.bindings
        .spine_curve_timeline_set_bezier(_ptr, bezier, frame, value, time1, value1, cx1, cy1, cx2, cy2, time2, value2);
  }

  double getBezierValue(double time, int frame, int valueOffset, int i) {
    final result = SpineBindings.bindings.spine_curve_timeline_get_bezier_value(_ptr, time, frame, valueOffset, i);
    return result;
  }

  ArrayFloat get curves {
    final result = SpineBindings.bindings.spine_curve_timeline_get_curves(_ptr);
    return ArrayFloat.fromPointer(result);
  }
}
