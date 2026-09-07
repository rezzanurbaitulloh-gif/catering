/// Tombol ambil foto bukti: kamera → upload bucket 'evidence'.
library;

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api.dart';

class PhotoEvidenceButton extends StatefulWidget {
  final void Function(String url) onUploaded;
  final String filePrefix;
  const PhotoEvidenceButton({
    super.key,
    required this.onUploaded,
    this.filePrefix = 'bukti',
  });

  @override
  State<PhotoEvidenceButton> createState() => _PhotoEvidenceButtonState();
}

class _PhotoEvidenceButtonState extends State<PhotoEvidenceButton> {
  bool _busy = false;
  String? _error;

  Future<void> _take() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.camera,
        imageQuality: 70,
        maxWidth: 1600,
      );
      if (picked == null) {
        setState(() => _busy = false);
        return;
      }
      final name =
          '${widget.filePrefix}-${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await ApiService.instance.uploadEvidence(
        File(picked.path),
        name,
      );
      if (!mounted) return;
      widget.onUploaded(url);
      setState(() => _busy = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Gagal mengambil/mengunggah foto: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton.icon(
          onPressed: _busy ? null : _take,
          icon: _busy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                )
              : const Icon(Icons.photo_camera),
          label: Text(_busy ? 'Mengunggah…' : 'Ambil Foto Bukti'),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    );
  }
}
