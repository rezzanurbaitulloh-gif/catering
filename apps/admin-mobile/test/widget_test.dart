// Tes logika mobile murni: mesin transisi event + roundtrip op offline.
import 'package:flutter_test/flutter_test.dart';

import 'package:catering_admin_mobile/api.dart';
import 'package:catering_admin_mobile/offline.dart';

void main() {
  test('EventFlow hanya mengizinkan transisi valid', () {
    expect(EventFlow.canTransition('IN_PREPARATION', 'IN_TRANSIT'), isTrue);
    expect(EventFlow.canTransition('IN_TRANSIT', 'SETUP'), isTrue);
    expect(EventFlow.canTransition('SETUP', 'SERVICE'), isTrue);
    expect(EventFlow.canTransition('PLANNING', 'SERVICE'), isFalse);
    expect(EventFlow.canTransition('CLOSED', 'PLANNING'), isFalse);
    expect(
      EventFlow.nextStatuses('IN_TRANSIT'),
      contains('SETUP'),
    );
  });

  test('PendingOp JSON roundtrip menyimpan idempotency payload', () {
    final op = PendingOp(
      key: 'k1',
      type: OpType.taskToggle,
      label: 'Centang Meja',
      payload: const {
        'table': 'setup_tasks',
        'row_id': 'r1',
        'done': true,
        'idempotency_key': 'idem-1',
      },
    );
    final back = PendingOp.fromJson(op.toJson());
    expect(back.key, 'k1');
    expect(back.type, OpType.taskToggle);
    expect(back.payload['idempotency_key'], 'idem-1');
    expect(back.state, OpState.pendingSync);
  });
}
