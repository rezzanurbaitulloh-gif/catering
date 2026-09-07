/// Lapor insiden dari lapangan: kategori, severity, judul, kronologi,
/// foto bukti. Dibuat online (butuh id balikan); offline → pesan jujur.
library;

import 'package:flutter/material.dart';

import '../api.dart';
import '../config.dart';
import '../widgets/photo_evidence_button.dart';

class IncidentReportScreen extends StatefulWidget {
  final String? eventId;
  final String eventTitle;
  const IncidentReportScreen({super.key, this.eventId, this.eventTitle = ''});

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  String _category = 'Operasional';
  String _severity = 'MEDIUM';
  String? _businessId;
  String? _photoUrl;
  bool _loadingBiz = true;
  bool _sending = false;
  String? _error;
  String? _doneNo;

  static const categories = [
    'Operasional',
    'Peralatan',
    'Armada',
    'Venue',
    'Staf',
    'Menu',
    'Pembayaran',
    'Lainnya',
  ];

  @override
  void initState() {
    super.initState();
    _loadBiz();
  }

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  Future<void> _loadBiz() async {
    try {
      final ev = widget.eventId == null
          ? null
          : await ApiService.instance.fetchEvent(widget.eventId!);
      if (!mounted) return;
      setState(() {
        _businessId = (ev?['business_id'] ?? '') as String;
        _loadingBiz = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loadingBiz = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_title.text.trim().length < 4) {
      setState(() => _error = 'Judul minimal 4 huruf.');
      return;
    }
    if (_desc.text.trim().length < 10) {
      setState(() => _error = 'Kronologi minimal 10 huruf.');
      return;
    }
    if ((_businessId ?? '').isEmpty) {
      setState(() => _error = 'Event tidak terbaca — buka dari detail event.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final id = await ApiService.instance.createIncident(
        eventId: widget.eventId,
        category: _category,
        severity: _severity,
        title: _title.text.trim(),
        description: _desc.text.trim(),
        businessId: _businessId!,
      );
      if ((_photoUrl ?? '').isNotEmpty) {
        await ApiService.instance.addIncidentEvidence(
          incidentId: id,
          photoUrl: _photoUrl!,
          caption: 'Bukti lapangan',
        );
      }
      if (!mounted) return;
      setState(() {
        _sending = false;
        _doneNo = id.substring(0, 8);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sending = false;
        _error = 'Gagal mengirim (offline?): $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.eventTitle.isEmpty
            ? 'Lapor Insiden'
            : 'Insiden — ${widget.eventTitle}'),
      ),
      body: _loadingBiz
          ? const Center(child: CircularProgressIndicator())
          : _doneNo != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.check_circle,
                          size: 64,
                          color: AppColors.success,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Insiden tercatat ✓',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Supervisor akan menindaklanjuti. Tambahkan info lewat menu insiden bila perlu.',
                          textAlign: TextAlign.center,
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
                            color: AppColors.danger,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _category,
                            items: [
                              for (final c in categories)
                                DropdownMenuItem(
                                  value: c,
                                  child: Text(c),
                                ),
                            ],
                            onChanged: (v) => setState(
                              () => _category = v ?? _category,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Kategori',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _severity,
                            items: const [
                              DropdownMenuItem(
                                value: 'LOW',
                                child: Text('Ringan'),
                              ),
                              DropdownMenuItem(
                                value: 'MEDIUM',
                                child: Text('Sedang'),
                              ),
                              DropdownMenuItem(
                                value: 'HIGH',
                                child: Text('Tinggi'),
                              ),
                              DropdownMenuItem(
                                value: 'CRITICAL',
                                child: Text('Kritis'),
                              ),
                            ],
                            onChanged: (v) => setState(
                              () => _severity = v ?? _severity,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Dampak',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _title,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        labelText: 'Judul singkat *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _desc,
                      maxLines: 4,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        labelText: 'Kronologi: apa, kapan, dampak *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            (_photoUrl ?? '').isEmpty
                                ? 'Belum ada foto bukti.'
                                : 'Foto terlampir ✓',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        PhotoEvidenceButton(
                          filePrefix: 'insiden',
                          onUploaded: (url) =>
                              setState(() => _photoUrl = url),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _sending ? null : _submit,
                      icon: _sending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.report_problem_outlined),
                      label: Text(
                        _sending ? 'Mengirim…' : 'Kirim Laporan',
                        style: const TextStyle(fontSize: 16),
                      ),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(48, 56),
                      ),
                    ),
                  ],
                ),
    );
  }
}
