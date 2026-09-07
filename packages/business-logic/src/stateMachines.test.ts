// Skenario kritis §65: transisi status valid vs invalid di semua mesin.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LeadMachine, QuoteMachine, BookingMachine, EventMachine,
  PaymentMachine, IncidentMachine, ProductionMachine,
} from './stateMachines.js';

describe('state machines', () => {
  it('event lifecycle penuh valid berurutan', () => {
    const flow = ['PLANNING', 'LOCKED', 'IN_PREPARATION', 'IN_TRANSIT', 'SETUP', 'SERVICE', 'BREAKDOWN', 'COMPLETED', 'CLOSED'] as const;
    for (let i = 0; i < flow.length - 1; i++) {
      assert.equal(EventMachine.can(flow[i], flow[i + 1]), true, `${flow[i]} → ${flow[i + 1]}`);
    }
  });
  it('menolak lompatan & kemunduran event', () => {
    assert.equal(EventMachine.can('PLANNING', 'SERVICE'), false);
    assert.equal(EventMachine.can('SERVICE', 'SETUP'), false);
    assert.equal(EventMachine.can('CLOSED', 'PLANNING'), false);
    assert.throws(() => EventMachine.assert('PLANNING', 'SERVICE'));
  });
  it('quote approval hanya dari SENT/VIEWED', () => {
    assert.equal(QuoteMachine.can('SENT', 'APPROVED'), true);
    assert.equal(QuoteMachine.can('VIEWED', 'APPROVED'), true);
    assert.equal(QuoteMachine.can('DRAFT', 'APPROVED'), false);
    assert.equal(QuoteMachine.can('APPROVED', 'REJECTED'), false);
  });
  it('payment & incident flows', () => {
    assert.equal(PaymentMachine.can('PENDING', 'PARTIAL'), true);
    assert.equal(PaymentMachine.can('PAID', 'REFUNDED'), true);
    assert.equal(PaymentMachine.can('PENDING', 'REFUNDED'), false);
    assert.equal(IncidentMachine.can('OPEN', 'INVESTIGATING'), true);
    assert.equal(IncidentMachine.can('OPEN', 'RESOLVED'), false);
    assert.equal(IncidentMachine.can('RESOLVED', 'ACTION_REQUIRED'), true);
  });
  it('lead, booking, production flows', () => {
    assert.equal(LeadMachine.can('QUALIFIED', 'CONVERTED'), true);
    assert.equal(LeadMachine.can('NEW', 'CONVERTED'), false);
    assert.equal(BookingMachine.can('TENTATIVE', 'CONFIRMED'), true);
    assert.equal(ProductionMachine.can('QC', 'PRODUCING'), true); // rework
    assert.equal(ProductionMachine.can('PLANNED', 'QC'), false);
  });
});
