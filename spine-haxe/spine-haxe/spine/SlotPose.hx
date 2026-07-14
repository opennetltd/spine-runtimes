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

import spine.attachments.Attachment;
import spine.attachments.VertexAttachment;

/** Stores a slot's pose. Slots organize attachments for {@link Skeleton#drawOrder} purposes and provide a place to store state
 * for an attachment. State cannot be stored in an attachment itself because attachments are stateless and may be shared across
 * multiple skeletons. */
class SlotPose implements Pose<SlotPose> {
	/** The color used to tint the slot's attachment. If SlotData.darkColor is set, this is used as the light color for two
	 * color tinting. */
	public final color:Color = new Color(1, 1, 1, 1);

	/** The dark color used to tint the slot's attachment for two color tinting, or null if two color tinting is not used. The dark
	 * color's alpha is not used. */
	public var darkColor:Color = null;

	public var attachment(default, set):Attachment; // Not used in setup pose.

	/** The index of the texture region to display when the slot's attachment has a spine.attachments.Sequence. -1 represents the
	 * Sequence.getSetupIndex(). */
	public var sequenceIndex = -1;

	/** Values to deform the slot's attachment. For an unweighted mesh, the entries are local positions for each vertex. For a
	 * weighted mesh, the entries are an offset for each vertex which will be added to the mesh's local vertex positions.
	 * @see spine.attachments.VertexAttachment.computeWorldVertices()
	 * @see spine.animation.DeformTimeline */
	public var deform:Array<Float> = new Array<Float>();

	public function new() {}

	public function set(pose:SlotPose):Void {
		if (pose == null)
			throw new SpineException("pose cannot be null.");
		color.setFromColor(pose.color);
		if (darkColor != null)
			darkColor.setFromColor(pose.darkColor);
		attachment = pose.attachment;
		sequenceIndex = pose.sequenceIndex;
		deform.resize(0);
		for (e in pose.deform)
			deform.push(e);
	}

	/** Sets the slot's attachment and, if the attachment changed, resets sequenceIndex and clears the deform.
	 * The deform is not cleared if the old attachment has the same spine.attachments.VertexAttachment.timelineAttachment as the
	 * specified attachment. */
	public function set_attachment(attachmentNew:Attachment):Attachment {
		if (attachment == attachmentNew)
			return attachment;
		if (!Std.isOfType(attachmentNew, VertexAttachment)
			|| !Std.isOfType(attachment, VertexAttachment)
			|| cast(attachmentNew, VertexAttachment).timelineAttachment != cast(attachment, VertexAttachment).timelineAttachment) {
			deform = new Array<Float>();
		}
		attachment = attachmentNew;
		sequenceIndex = -1;
		return attachment;
	}
}
