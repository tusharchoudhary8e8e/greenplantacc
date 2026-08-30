-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: ATOMIC MULTI-TABLE TRANSACTIONS (ACID GUARANTEE)
-- Prevents Orphan Headers and Partial Database Inserts
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Atomic Order + Items Transaction
CREATE OR REPLACE FUNCTION atomic_create_order(
  p_order jsonb,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_order_id text;
  v_user_id uuid;
  v_item jsonb;
BEGIN
  v_user_id := auth.uid();
  v_order_id := COALESCE(p_order->>'id', 'ord-' || extract(epoch from now())::text);

  -- Insert Order Header
  INSERT INTO ma_orders (
    id,
    user_id,
    order_no,
    customer_id,
    customer_name,
    order_date,
    status,
    transport_charge,
    advance_payment,
    foc_amount,
    items_total,
    total_amount,
    narration,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_user_id,
    p_order->>'order_no',
    p_order->>'customer_id',
    p_order->>'customer_name',
    (p_order->>'order_date')::date,
    COALESCE(p_order->>'status', 'confirmed'),
    COALESCE((p_order->>'transport_charge')::numeric, 0),
    COALESCE((p_order->>'advance_payment')::numeric, 0),
    COALESCE((p_order->>'foc_amount')::numeric, 0),
    COALESCE((p_order->>'items_total')::numeric, 0),
    COALESCE((p_order->>'total_amount')::numeric, 0),
    p_order->>'narration',
    now(),
    now()
  );

  -- Insert All Line Items Atomically
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO ma_order_items (
        order_id,
        product_name,
        variant_name,
        price,
        quantity,
        dispatch_from,
        dispatch_to,
        sowing_date,
        dispatched_qty,
        status
      ) VALUES (
        v_order_id,
        v_item->>'product_name',
        v_item->>'variant_name',
        COALESCE((v_item->>'price')::numeric, 0),
        COALESCE((v_item->>'quantity')::numeric, 1),
        v_item->>'dispatch_from',
        v_item->>'dispatch_to',
        v_item->>'sowing_date',
        COALESCE((v_item->>'dispatched_qty')::numeric, 0),
        COALESCE(v_item->>'status', 'pending')
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  -- Automatically rolls back all header and item inserts on failure
  RAISE EXCEPTION 'Atomic order creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atomic Purchase Bill + Items Transaction
CREATE OR REPLACE FUNCTION atomic_create_purchase_bill(
  p_bill jsonb,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_bill_id text;
  v_user_id uuid;
  v_item jsonb;
BEGIN
  v_user_id := auth.uid();
  v_bill_id := COALESCE(p_bill->>'id', 'pur-' || extract(epoch from now())::text);

  -- Insert or Replace Bill Header
  INSERT INTO ma_purchase_bills (
    id,
    user_id,
    bill_no,
    party_id,
    party_name,
    bill_date,
    gst_type,
    gst_value,
    gst_amount,
    transport_charge,
    paid_amount,
    items_total,
    total_amount,
    due_amount,
    status,
    narration,
    created_at
  ) VALUES (
    v_bill_id,
    v_user_id,
    p_bill->>'bill_no',
    p_bill->>'party_id',
    p_bill->>'party_name',
    (p_bill->>'bill_date')::date,
    p_bill->>'gst_type',
    COALESCE((p_bill->>'gst_value')::numeric, 0),
    COALESCE((p_bill->>'gst_amount')::numeric, 0),
    COALESCE((p_bill->>'transport_charge')::numeric, 0),
    COALESCE((p_bill->>'paid_amount')::numeric, 0),
    COALESCE((p_bill->>'items_total')::numeric, 0),
    COALESCE((p_bill->>'total_amount')::numeric, 0),
    COALESCE((p_bill->>'due_amount')::numeric, 0),
    COALESCE(p_bill->>'status', 'unpaid'),
    p_bill->>'narration',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    bill_no = EXCLUDED.bill_no,
    party_id = EXCLUDED.party_id,
    party_name = EXCLUDED.party_name,
    bill_date = EXCLUDED.bill_date,
    gst_type = EXCLUDED.gst_type,
    gst_value = EXCLUDED.gst_value,
    gst_amount = EXCLUDED.gst_amount,
    transport_charge = EXCLUDED.transport_charge,
    paid_amount = EXCLUDED.paid_amount,
    items_total = EXCLUDED.items_total,
    total_amount = EXCLUDED.total_amount,
    due_amount = EXCLUDED.due_amount,
    status = EXCLUDED.status,
    narration = EXCLUDED.narration;

  -- Delete previous items and insert new ones atomically
  DELETE FROM ma_purchase_bill_items WHERE bill_id = v_bill_id;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO ma_purchase_bill_items (
        bill_id,
        product_name,
        variant_name,
        price,
        quantity,
        line_total
      ) VALUES (
        v_bill_id,
        v_item->>'product_name',
        v_item->>'variant_name',
        COALESCE((v_item->>'price')::numeric, 0),
        COALESCE((v_item->>'quantity')::numeric, 1),
        COALESCE((v_item->>'price')::numeric, 0) * COALESCE((v_item->>'quantity')::numeric, 1)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'bill_id', v_bill_id);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Atomic purchase bill creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
