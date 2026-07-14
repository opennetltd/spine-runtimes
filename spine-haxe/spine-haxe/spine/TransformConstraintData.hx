/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated April 5, 2025. Replaces all prior versions.
 *
 * Copyright (c) 2013-2025, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*****************************************************************************/

package spine;

/**
 * Stores the setup pose for a spine.TransformConstraint.
 *
 *
 * @see https://esotericsoftware.com/spine-transform-constraints Transform constraints in the Spine User Guide
 */
class TransformConstraintData extends ConstraintData<TransformConstraint, TransformConstraintPose> {
	public static inline final ROTATION = 0;
	public static inline final X = 1;
	public static inline final Y = 2;
	public static inline final SCALEX = 3;
	public static inline final SCALEY = 4;
	public static inline final SHEARY = 5;

	/** The bones that will be modified by this transform constraint. */
	public final bones:Array<BoneData> = new Array<BoneData>();

	/** The bone whose world transform will be copied to the constrained bones. */
	public var source(default, set):BoneData;

	public var offsets:Array<Float> = [for (_ in 0...6) 0.0];

	/** Reads the source bone's local transform instead of its world transform. */
	public var localSource = false;

	/** Sets the constrained bones' local transforms instead of their world transforms. */
	public var localTarget = false;

	/** Adds the source bone transform to the constrained bones instead of setting it absolutely. */
	public var additive = false;

	/** Prevents constrained bones from exceeding the ranged defined by ToProperty.offset and ToProperty.max. */
	public var clamp = false;

	/** The mapping of transform properties to other transform properties. */
	public final properties = new Array<FromProperty>();

	public function new(name:String) {
		super(name, new TransformConstraintPose());
	}

	public function create(skeleton:Skeleton) {
		return new TransformConstraint(this, skeleton);
	}

	public function set_source(source:BoneData):BoneData {
		if (source == null)
			throw new SpineException("source cannot be null.");
		this.source = source;
		return source;
	}

	/** An offset added to the constrained bone rotation. */
	public function getOffsetRotation():Float {
		return offsets[TransformConstraintData.ROTATION];
	}

	public function setOffsetRotation(offsetRotation:Float):Float {
		offsets[TransformConstraintData.ROTATION] = offsetRotation;
		return offsetRotation;
	}

	/** An offset added to the constrained bone X translation. */
	public function getOffsetX():Float {
		return offsets[TransformConstraintData.X];
	}

	public function setOffsetX(offsetX:Float):Float {
		offsets[TransformConstraintData.X] = offsetX;
		return offsetX;
	}

	/** An offset added to the constrained bone Y translation. */
	public function getOffsetY():Float {
		return offsets[TransformConstraintData.Y];
	}

	public function setOffsetY(offsetY:Float):Float {
		offsets[TransformConstraintData.Y] = offsetY;
		return offsetY;
	}

	/** An offset added to the constrained bone scaleX. */
	public function getOffsetScaleX():Float {
		return offsets[TransformConstraintData.SCALEX];
	}

	public function setOffsetScaleX(offsetScaleX:Float):Float {
		offsets[TransformConstraintData.SCALEX] = offsetScaleX;
		return offsetScaleX;
	}

	/** An offset added to the constrained bone scaleY. */
	public function getOffsetScaleY():Float {
		return offsets[TransformConstraintData.SCALEY];
	}

	public function setOffsetScaleY(offsetScaleY:Float):Float {
		offsets[TransformConstraintData.SCALEY] = offsetScaleY;
		return offsetScaleY;
	}

	/** An offset added to the constrained bone shearY. */
	public function getOffsetShearY():Float {
		return offsets[TransformConstraintData.SHEARY];
	}

	public function setOffsetShearY(offsetShearY:Float):Float {
		offsets[TransformConstraintData.SHEARY] = offsetShearY;
		return offsetShearY;
	}
}

/** Source property for a {@link TransformConstraint}. */
abstract class FromProperty {
	public function new() {}

	/** The value of this property that corresponds to ToProperty.offset. */
	public var offset:Float;

	/** Constrained properties. */
	public final to = new Array<ToProperty>();

	/** Reads this property from the specified bone. */
	abstract public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float;
}

/** Constrained property for a TransformConstraint. */
abstract class ToProperty {
	public function new() {}

	/** The value of this property that corresponds to FromProperty.offset. */
	public var offset:Float;

	/** The maximum value of this property when is clamped (TransformConstraintData.clamp). */
	public var max:Float;

	/** The scale of the FromProperty value in relation to this property. */
	public var scale:Float;

	/** Reads the mix for this property from the specified pose. */
	abstract public function mix(pose:TransformConstraintPose):Float;

	/** Applies the value to this property. */
	abstract public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void;
}

class FromRotate extends FromProperty {
	public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float {
		if (local)
			return source.rotation + offsets[TransformConstraintData.ROTATION];
		var sx = skeleton.scaleX, sy = skeleton.scaleY;
		var value = Math.atan2(source.c / sy, source.a / sx) * MathUtils.radDeg
			+ ((source.a * source.d - source.b * source.c) * sx * sy > 0 ? offsets[TransformConstraintData.ROTATION] :
				-offsets[TransformConstraintData.ROTATION]);
		if (value < 0)
			value += 360;
		return value;
	}
}

class ToRotate extends ToProperty {
	public function mix(pose:TransformConstraintPose):Float {
		return pose.mixRotate;
	}

	public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void {
		if (local)
			bone.rotation += (additive ? value : value - bone.rotation) * pose.mixRotate;
		else {
			var sx = skeleton.scaleX, sy = skeleton.scaleY, ix = 1 / sx, iy = 1 / sy;
			var a = bone.a * ix,
				b = bone.b * ix,
				c = bone.c * iy,
				d = bone.d * iy;
			value *= MathUtils.degRad;
			if (!additive)
				value -= Math.atan2(c, a);
			if (value > MathUtils.PI)
				value -= MathUtils.PI2;
			else if (value < -MathUtils.PI) //
				value += MathUtils.PI2;
			value *= pose.mixRotate;
			var cos = Math.cos(value), sin = Math.sin(value);
			bone.a = (cos * a - sin * c) * sx;
			bone.b = (cos * b - sin * d) * sx;
			bone.c = (sin * a + cos * c) * sy;
			bone.d = (sin * b + cos * d) * sy;
		}
	}
}

class FromX extends FromProperty {
	public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float {
		return local ? source.x + offsets[TransformConstraintData.X] : (offsets[TransformConstraintData.X] * source.a
			+ offsets[TransformConstraintData.Y] * source.b + source.worldX) / skeleton.scaleX;
	}
}

class ToX extends ToProperty {
	public function mix(pose:TransformConstraintPose):Float {
		return pose.mixX;
	}

	public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void {
		if (local)
			bone.x += (additive ? value : value - bone.x) * pose.mixX;
		else {
			if (!additive)
				value -= bone.worldX / skeleton.scaleX;
			bone.worldX += value * pose.mixX * skeleton.scaleX;
		}
	}
}

class FromY extends FromProperty {
	public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float {
		return local ? source.y + offsets[TransformConstraintData.Y] : (offsets[TransformConstraintData.X] * source.c
			+ offsets[TransformConstraintData.Y] * source.d + source.worldY) / skeleton.scaleY;
	}
}

class ToY extends ToProperty {
	public function mix(pose:TransformConstraintPose):Float {
		return pose.mixY;
	}

	public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void {
		if (local)
			bone.y += (additive ? value : value - bone.y) * pose.mixY;
		else {
			if (!additive)
				value -= bone.worldY / skeleton.scaleY;
			bone.worldY += value * pose.mixY * skeleton.scaleY;
		}
	}
}

class FromScaleX extends FromProperty {
	public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float {
		if (local)
			return source.scaleX + offsets[TransformConstraintData.SCALEX];
		var a = source.a / skeleton.scaleX, c = source.c / skeleton.scaleY;
		return Math.sqrt(a * a + c * c) + offsets[TransformConstraintData.SCALEX];
	}
}

class ToScaleX extends ToProperty {
	public function mix(pose:TransformConstraintPose):Float {
		return pose.mixScaleX;
	}

	public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void {
		if (local) {
			if (additive)
				bone.scaleX *= 1 + (value - 1) * pose.mixScaleX;
			else if (bone.scaleX != 0) //
				bone.scaleX += (value - bone.scaleX) * pose.mixScaleX;
		} else if (additive) {
			var s = 1 + (value - 1) * pose.mixScaleX;
			bone.a *= s;
			bone.c *= s;
		} else {
			var a = bone.a / skeleton.scaleX,
				c = bone.c / skeleton.scaleY,
				s = Math.sqrt(a * a + c * c);
			if (s != 0) {
				s = 1 + (value - s) * pose.mixScaleX / s;
				bone.a *= s;
				bone.c *= s;
			}
		}
	}
}

class FromScaleY extends FromProperty {
	public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float {
		if (local)
			return source.scaleY + offsets[TransformConstraintData.SCALEY];
		var b = source.b / skeleton.scaleX, d = source.d / skeleton.scaleY;
		return Math.sqrt(b * b + d * d) + offsets[TransformConstraintData.SCALEY];
	}
}

class ToScaleY extends ToProperty {
	public function mix(pose:TransformConstraintPose):Float {
		return pose.mixScaleY;
	}

	public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void {
		if (local) {
			if (additive)
				bone.scaleY *= 1 + (value - 1) * pose.mixScaleY;
			else if (bone.scaleY != 0) //
				bone.scaleY += (value - bone.scaleY) * pose.mixScaleY;
		} else if (additive) {
			var s = 1 + (value - 1) * pose.mixScaleY;
			bone.b *= s;
			bone.d *= s;
		} else {
			var b = bone.b / skeleton.scaleX,
				d = bone.d / skeleton.scaleY,
				s = Math.sqrt(b * b + d * d);
			if (s != 0) {
				s = 1 + (value - s) * pose.mixScaleY / s;
				bone.b *= s;
				bone.d *= s;
			}
		}
	}
}

class FromShearY extends FromProperty {
	public function value(skeleton:Skeleton, source:BonePose, local:Bool, offsets:Array<Float>):Float {
		if (local)
			return source.shearY + offsets[TransformConstraintData.SHEARY];
		var ix = 1 / skeleton.scaleX, iy = 1 / skeleton.scaleY;
		return (Math.atan2(source.d * iy, source.b * ix)
			- Math.atan2(source.c * iy, source.a * ix)) * MathUtils.radDeg
			- 90
			+ offsets[TransformConstraintData.SHEARY];
	}
}

class ToShearY extends ToProperty {
	public function mix(pose:TransformConstraintPose):Float {
		return pose.mixShearY;
	}

	public function apply(skeleton:Skeleton, pose:TransformConstraintPose, bone:BonePose, value:Float, local:Bool, additive:Bool):Void {
		if (local) {
			if (!additive)
				value -= bone.shearY;
			bone.shearY += value * pose.mixShearY;
		} else {
			var sx = skeleton.scaleX,
				sy = skeleton.scaleY,
				b = bone.b / sx,
				d = bone.d / sy,
				by = Math.atan2(d, b);
			value = (value + 90) * MathUtils.degRad;
			if (additive)
				value -= MathUtils.PI / 2;
			else {
				value -= by - Math.atan2(bone.c / sx, bone.a / sy);
				if (value > MathUtils.PI)
					value -= MathUtils.PI2;
				else if (value < -MathUtils.PI)
					value += MathUtils.PI2;
			}
			value = by + value * pose.mixShearY;
			var s = Math.sqrt(b * b + d * d);
			bone.b = Math.cos(value) * s * sy;
			bone.d = Math.sin(value) * s * sx;
		}
	}
}
