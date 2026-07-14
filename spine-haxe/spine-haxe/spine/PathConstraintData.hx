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

/** Stores the setup pose for a spine.PathConstraint.
 *
 * @see https://esotericsoftware.com/spine-path-constraints Path constraints in the Spine User Guide */
class PathConstraintData extends ConstraintData<PathConstraint, PathConstraintPose> {
	/** The bones that will be modified by this path constraint. */
	public final bones:Array<BoneData> = new Array<BoneData>();

	/** The slot whose path attachment will be used to constrain the bones. */
	public var slot(default, set):SlotData;

	/** The mode for positioning the first bone on the path. */
	public var positionMode(default, set):PositionMode = PositionMode.fixed;

	/** The mode for positioning the bones after the first bone on the path. */
	public var spacingMode(default, set):SpacingMode = SpacingMode.fixed;

	/** The mode for adjusting the rotation of the bones. */
	public var rotateMode(default, set):RotateMode = RotateMode.chain;

	/** An offset added to the constrained bone rotation. */
	public var offsetRotation:Float = 0;

	public function new(name:String) {
		super(name, new PathConstraintPose());
	}

	public function create(skeleton:Skeleton) {
		return new PathConstraint(this, skeleton);
	}

	public function set_slot(slot:SlotData):SlotData {
		if (slot == null)
			throw new SpineException("slot cannot be null.");
		this.slot = slot;
		return slot;
	}

	public function set_positionMode(positionMode:PositionMode):PositionMode {
		if (positionMode == null)
			throw new SpineException("positionMode cannot be null.");
		this.positionMode = positionMode;
		return positionMode;
	}

	public function set_spacingMode(spacingMode:SpacingMode):SpacingMode {
		if (spacingMode == null)
			throw new SpineException("spacingMode cannot be null.");
		this.spacingMode = spacingMode;
		return spacingMode;
	}

	public function set_rotateMode(rotateMode:RotateMode):RotateMode {
		if (rotateMode == null)
			throw new SpineException("rotateMode cannot be null.");
		this.rotateMode = rotateMode;
		return rotateMode;
	}
}
