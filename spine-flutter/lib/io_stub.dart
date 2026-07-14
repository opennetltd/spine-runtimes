import 'dart:typed_data';

/// Stub File class for web platform
class File {
  final String path;

  File(this.path);

  Future<Uint8List> readAsBytes() async {
    throw UnsupportedError('File operations are not supported on web. Use fromAsset or fromHttp instead.');
  }

  Future<String> readAsString() async {
    throw UnsupportedError('File operations are not supported on web. Use fromAsset or fromHttp instead.');
  }
}
