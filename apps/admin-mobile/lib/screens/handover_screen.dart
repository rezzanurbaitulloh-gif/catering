/// Serah terima digital: penerima venue + foto + jumlah terkirim + catatan.
/// Bukti delivery/handover tersimpan sebagai milestone transport.
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../offline.dart';
import '../widgets/big_action_button.dart';
import '../widgets/photo_evidence_button.dart';
import '../widgets/sync_banner.dart';

class HandoverScreen extends StatefulWidget {
  final String eventId;
  final String eventTitle;
  const HandoverScreen({
    super.key,
    required this.eventId,
    this.eventTitle = '',
  });

  @override
  State<HandoverScreen> createState() => _HandoverScreenState();
}

class _HandoverScreenState extends State<HandoverScreen> {
  List<Map<String, dynamic>> _transport = [];
  List<Map<String, dynamic>> _items = [];
  String? _transportId;
  final _receiver = TextEditingController();
  final _note = TextEditingController();
  String? _photoUrl;
  bool _loading = true;
  bool _sending = false;
  String? _error;
  String? _done;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _receiver.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ApiService.instance;
      final t = await api.fetchTransportTasks(widget.eventId);
      final items = await api.fetchEventItems(widget.eventId);
      if (!mounted) return;
      setState(() {
        _transport = t;
        _items = items;
        if (_transportId == null && t.isNotEmpty) {
          _transportId = (t.first['id'] ?? '') as String;
        }
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_transportId == null) {
      setState(() => _error = 'Belum ada tugas transport untuk event ini.');
      return;
    }
    if (_receiver.text.trim().length < 2) {
      setState(() => _error = 'Isi nama penerima (min 2 huruf).');
      return;
    }
    if ((_photoUrl ?? '').isEmpty) {
      setState(() => _error = 'Ambil foto serah terima dulu.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    final ok = await OfflineStore.instance.runOrQueue(
      OpType.handover,
      'Serah terima ${widget.eventTitle}',
      {
        'event_id': widget.eventId,
        'transport_id': _transportId!,
        'receiver_name': _receiver.text.trim(),
        'photo_url': _photoUrl!,
        'note': _note.text.trim(),
      },
    );
    if (!mounted) return;
    setState(() {
      _sending = false;
      _done = ok
          ? 'Serah terima tercatat di server ✓'
          : 'Tersimpan offline, menunggu sinkron.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Serah Terima — ${widget.eventTitle}')),
      body: Column(
        children: [
          SyncBanner(
            store: OfflineStore.instance,
            onRetry: () => OfflineStore.instance.retryFailed(),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _done != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.check_circle,
                                size: 64,
                                color: Color(0xFF15803D),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _done!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 16),
                              FilledButton(
                                onPressed: () => Navigator.of(context).pop(),
                                child: const Text('Kembali'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView(
                        padding: const EdgeInsets.all(14),
                        children: [
                          if (_error != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEE2E2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _error!,
                                style: const TextStyle(
                                  color: Color(0xFFB91C1C),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          const Text(
                            'Tugas transport',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            initialValue: _transportId,
                            items: [
                              for (final t in _transport)
                                DropdownMenuItem(
                                  value: (t['id'] ?? '') as String,
                                  child: Text(
                                      (t['kind'] ?? 'Pengiriman') as String),
                                ),
                            ],
                            onChanged: (v) =>
                                setState(() => _transportId = v),
                            decoration: const InputDecoration(
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Barang terkirim',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  if (_items.isEmpty)
                                    const Text(
                                        'Belum ada item tercatat.'),
                                  for (final it in _items)
                                    Padding(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 2,
                                      ),
                                      child: Text(
                                        '• ${it['name']} — ${it['packed_qty']}/${it['required_qty'] ?? '?'} ${it['unit'] ?? ''}',
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _receiver,
                            textCapitalization:
                                TextCapitalization.words,
                            decoration: const InputDecoration(
                              labelText: 'Nama penerima *',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _note,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              labelText: 'Catatan serah terima',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  (_photoUrl ?? '').isEmpty
                                      ? 'Belum ada foto.'
                                      : 'Foto terlampir ✓',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              PhotoEvidenceButton(
                                filePrefix: 'handover',
                                onUploaded: (url) => setState(
                                  () => _photoUrl = url,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          BigActionButton(
                            label: 'Catat Serah Terima',
                            subtitle: 'Dengan foto bukti',
                            icon: Icons.handshake_outlined,
                            loading: _sending,
                            onPressed:
                                _sending ? null : () => _submit(),
                          ),
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}
