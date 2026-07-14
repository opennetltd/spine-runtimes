package spine.utils;

enum JsonContext {
	Object;
	Array;
}

class JsonWriter {
	private var buffer:StringBuf = new StringBuf();
	private var needsComma:Bool = false;
	private var contexts:Array<JsonContext> = [];

	public function new() {
		buffer = new StringBuf();
		needsComma = false;
		contexts = [];
	}

	public function writeObjectStart():Void {
		writeCommaIfNeeded();
		buffer.add("{");
		contexts.push(Object);
		needsComma = false;
	}

	public function writeObjectEnd():Void {
		buffer.add("}");
		contexts.pop();
		needsComma = true;
	}

	public function writeArrayStart():Void {
		writeCommaIfNeeded();
		buffer.add("[");
		contexts.push(Array);
		needsComma = false;
	}

	public function writeArrayEnd():Void {
		buffer.add("]");
		contexts.pop();
		needsComma = true;
	}

	public function writeName(name:String):Void {
		writeCommaIfNeeded();
		buffer.add('"${escapeString(name)}":');
		needsComma = false;
	}

	public function writeValue(value:Dynamic):Void {
		writeCommaIfNeeded();

		if (value == null) {
			buffer.add("null");
		} else if (Std.isOfType(value, String)) {
			buffer.add('"${escapeString(cast(value, String))}"');
		} else if (Std.isOfType(value, Bool)) {
			buffer.add(value ? "true" : "false");
		} else if (Std.isOfType(value, Float) || Std.isOfType(value, Int)) {
			// Ensure consistent float formatting (C locale style)
			buffer.add(Std.string(value));
		} else {
			buffer.add(Std.string(value));
		}

		needsComma = true;
	}

	public function writeNull():Void {
		writeCommaIfNeeded();
		buffer.add("null");
		needsComma = true;
	}

	public function getString():String {
		return buffer.toString();
	}

	private function writeCommaIfNeeded():Void {
		if (needsComma) {
			buffer.add(",");
		}
	}

	private function escapeString(str:String):String {
		// Escape special characters for JSON
		str = StringTools.replace(str, "\\", "\\\\");
		str = StringTools.replace(str, '"', '\\"');
		str = StringTools.replace(str, "\n", "\\n");
		str = StringTools.replace(str, "\r", "\\r");
		str = StringTools.replace(str, "\t", "\\t");
		return str;
	}
}
