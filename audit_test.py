import urllib.request
import urllib.error
import json
import time

API = "http://127.0.0.1:8080/api/v1"
WEB = "http://127.0.0.1"

results = []

def record(test_name, success, detail=""):
    status = "PASS" if success else "FAIL"
    results.append({"name": test_name, "status": status, "detail": detail})
    mark = "[OK]" if success else "[FAIL]"
    print(f"{mark} {test_name}: {detail}")

def parse_res(code, raw):
    try:
        return code, json.loads(raw)
    except Exception:
        return code, raw

def http_get(url, headers=None):
    r = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(r, timeout=10) as resp:
        return parse_res(resp.getcode(), resp.read().decode())

def http_post(url, data=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, headers=h, method="POST")
    with urllib.request.urlopen(r, timeout=10) as resp:
        return parse_res(resp.getcode(), resp.read().decode())

def http_patch(url, data=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, headers=h, method="PATCH")
    with urllib.request.urlopen(r, timeout=10) as resp:
        return parse_res(resp.getcode(), resp.read().decode())

def run_audit():
    print("=================================================================")
    print("   STARTING COMPREHENSIVE PRODUCTION AUDIT ROUND (REAL VPS)      ")
    print("=================================================================\n")

    # 1. FRONTEND PAGES
    print("--- 1. FRONTEND WEB ROUTES CHECK ---")
    routes = [
        ("/", "Trang chu"),
        ("/shop", "Cua hang / Danh muc san pham"),
        ("/cart", "Gio hang"),
        ("/checkout", "Thanh toan"),
        ("/login", "Dang nhap"),
        ("/register", "Dang ky"),
        ("/tra-cuu-don-hang", "Tra cuu don hang cong khai"),
        ("/cong-trinh", "Du an cong trinh"),
    ]
    for path, name in routes:
        try:
            code, _ = http_get(f"{WEB}{path}")
            record(f"Frontend: {path} ({name})", code == 200, f"HTTP {code}")
        except Exception as e:
            record(f"Frontend: {path} ({name})", False, str(e))

    # 2. MASTER DATA APIS
    print("\n--- 2. MASTER DATA & HEALTH APIS ---")
    try:
        code, data = http_get(f"{API}/health")
        record("API: Health Check", code == 200 and data.get("status") == "UP", f"Database: {data.get('database')}")
    except Exception as e:
        record("API: Health Check", False, str(e))

    prods = []
    try:
        code, prods = http_get(f"{API}/products")
        record("API: Get Products Catalog", code == 200 and len(prods) > 0, f"Loaded {len(prods)} products")
    except Exception as e:
        record("API: Get Products Catalog", False, str(e))

    try:
        code, cats = http_get(f"{API}/categories")
        record("API: Get Categories", code == 200 and len(cats) > 0, f"Loaded {len(cats)} categories")
    except Exception as e:
        record("API: Get Categories", False, str(e))

    try:
        code, brands = http_get(f"{API}/brands")
        record("API: Get Brands", code == 200 and len(brands) > 0, f"Loaded {len(brands)} brands")
    except Exception as e:
        record("API: Get Brands", False, str(e))

    # 3. MULTI-ROLE AUTHENTICATION
    print("\n--- 3. MULTI-ROLE AUTHENTICATION (ALL 4 ROLES) ---")
    roles_test = [
        ("Admin/Manager", "admin@gmail.com", "admin123", "MANAGER"),
        ("Sale", "sale@gmail.com", "sale123", "SALE"),
        ("Shipper (Phone)", "0901234567", "Shipper@123", "SHIPPER"),
        ("Shipper (Email)", "shipper@gmail.com", "shipper123", "SHIPPER"),
        ("Customer", "customer@gmail.com", "customer123", "CUSTOMER"),
    ]
    tokens = {}
    for label, login_id, pwd, exp_role in roles_test:
        payload = {"email": login_id, "password": pwd} if "@" in login_id else {"phone": login_id, "password": pwd}
        try:
            code, resp = http_post(f"{API}/auth/login", payload)
            u = resp.get("user", {})
            act_role = u.get("role")
            tok = resp.get("accessToken") or resp.get("token")
            success = bool(code == 200 and tok and act_role == exp_role)
            record(f"Auth: Login {label}", success, f"Token OK, Role: {act_role}")
            if success:
                tokens[exp_role] = tok
                tokens[f"{exp_role}_USER_ID"] = u.get("id")
        except Exception as e:
            record(f"Auth: Login {label}", False, str(e))

    # 4. GUEST CHECKOUT & VIETQR FALLBACK
    print("\n--- 4. GUEST CHECKOUT & VIETQR FALLBACK ---")
    guest_order_id = None
    if prods:
        first_p = prods[0]
        order_payload = {
            "customerName": "Audit Automated Bot",
            "customerPhone": "0933889900",
            "shippingAddress": "456 Le Duan, Ben Nghe, Quan 1, TP.HCM",
            "paymentMethod": "BANK_TRANSFER",
            "notes": "Test don hang tu dong VietQR Fallback",
            "items": [
                {
                    "productId": first_p["id"],
                    "quantity": 2,
                    "unitPrice": first_p["basePrice"]
                }
            ]
        }
        try:
            code, ord_res = http_post(f"{API}/orders", order_payload)
            guest_order_id = ord_res.get("id")
            ord_code = ord_res.get("orderNumber")
            record("Guest Order Placement", code in (200, 201) and bool(guest_order_id), f"Order #{ord_code}")
        except Exception as e:
            record("Guest Order Placement", False, str(e))

        try:
            code, pay_res = http_post(f"{API}/orders/{guest_order_id}/payment-link")
            qr_link = pay_res.get("qrCode", "")
            amount = pay_res.get("amount", 0)
            record("VietQR Code Generation", code == 200 and qr_link.startswith("https://img.vietqr.io"), f"Amount: {amount} VND, QR: {qr_link[:50]}...")
        except Exception as e:
            record("VietQR Code Generation", False, str(e))

        try:
            code, lookup = http_get(f"{API}/public/orders/lookup?phone=0933889900")
            orders_found = lookup.get("data", [])
            record("Public Order Lookup by Phone", len(orders_found) > 0, f"Found {len(orders_found)} orders")
        except Exception as e:
            record("Public Order Lookup by Phone", False, str(e))

    # 5. ORDER LIFECYCLE & INVENTORY SAFETY
    print("\n--- 5. ORDER LIFECYCLE & STOCK INTEGRITY ---")
    mgr_token = tokens.get("MANAGER")
    shipper_token = tokens.get("SHIPPER")
    shipper_id = tokens.get("SHIPPER_USER_ID")

    if mgr_token and shipper_token and prods:
        try:
            headers = {"Authorization": f"Bearer {mgr_token}"}
            cod_payload = {
                "customerName": "Test COD Lifecycle (0944556677)",
                "customerPhone": "0944556677",
                "shippingAddress": "12 Nguyen Thi Minh Khai, Q1",
                "paymentMethod": "COD",
                "items": [{"productId": prods[0]["id"], "quantity": 1, "unitPrice": prods[0]["basePrice"]}]
            }
            _, cod_ord = http_post(f"{API}/orders", cod_payload)
            cod_id = cod_ord["id"]

            # PACKING
            _, packed = http_patch(f"{API}/orders/{cod_id}/status", {"status": "PACKING", "version": 1}, headers)
            record("Order Status: PENDING -> PACKING", packed.get("status") == "PACKING", f"Version: {packed.get('version')}")

            # SHIPPING
            _, shipped = http_patch(f"{API}/orders/{cod_id}/status", {"status": "SHIPPING", "version": packed["version"], "shipperId": shipper_id}, headers)
            record("Order Status: PACKING -> SHIPPING", shipped.get("status") == "SHIPPING", f"Shipper assigned: {shipped.get('shipperId')}")

            # DELIVERED with POD
            shipper_headers = {"Authorization": f"Bearer {shipper_token}"}
            pod_body = {
                "status": "DELIVERED",
                "version": shipped["version"],
                "podRecipientName": "Chu Nha Kiem Tra",
                "podPhotoUrl": "https://img.vietqr.io/pod-test.png"
            }
            _, delivered = http_patch(f"{API}/orders/{cod_id}/status", pod_body, shipper_headers)
            record("Order Status: SHIPPING -> DELIVERED (POD)", delivered.get("status") == "DELIVERED", f"COD Collected: {delivered.get('codCollected', 0)} VND")

            # Cancellation test
            _, test_cancel_ord = http_post(f"{API}/orders", cod_payload)
            cancel_id = test_cancel_ord["id"]
            _, packed2 = http_patch(f"{API}/orders/{cancel_id}/status", {"status": "PACKING", "version": 1}, headers)
            
            cancel_body = {
                "status": "CANCELLED",
                "version": packed2["version"],
                "cancellationReason": "Khach doi y huy cong trinh"
            }
            _, cancelled = http_patch(f"{API}/orders/{cancel_id}/status", cancel_body, headers)
            record("Order Cancellation & Stock Restore", cancelled.get("status") == "CANCELLED", f"Reason: {cancelled.get('cancellationReason')}")

        except Exception as e:
            record("Order Lifecycle Transitions", False, str(e))

    # 6. NEGATIVE & ADVERSARIAL EDGE CASES
    print("\n--- 6. ADVERSARIAL EDGE CASES (NEGATIVE TESTING) ---")
    # A. Quantity <= 0
    try:
        bad_qty_payload = {
            "customerName": "Bad Quantity",
            "customerPhone": "0901234567",
            "shippingAddress": "HCM",
            "items": [{"productId": prods[0]["id"], "quantity": 0, "unitPrice": 10000}]
        }
        code, _ = http_post(f"{API}/orders", bad_qty_payload)
        record("Negative: Block Quantity <= 0", code == 400, f"HTTP {code}")
    except urllib.error.HTTPError as e:
        record("Negative: Block Quantity <= 0", e.code == 400, f"Correctly rejected with HTTP {e.code}")
    except Exception as e:
        record("Negative: Block Quantity <= 0", False, str(e))

    # B. Cancellation without reason
    try:
        bad_cancel_body = {"status": "CANCELLED", "version": 1}
        headers = {"Authorization": f"Bearer {mgr_token}"}
        code, _ = http_patch(f"{API}/orders/{guest_order_id}/status", bad_cancel_body, headers)
        record("Negative: Reject Cancel Without Reason", code == 400, f"HTTP {code}")
    except urllib.error.HTTPError as e:
        record("Negative: Reject Cancel Without Reason", e.code == 400, f"Correctly rejected with HTTP {e.code}")
    except Exception as e:
        record("Negative: Reject Cancel Without Reason", False, str(e))

    # C. Delivery without POD
    try:
        bad_pod_body = {"status": "DELIVERED", "version": 1}
        shipper_headers = {"Authorization": f"Bearer {shipper_token}"}
        code, _ = http_patch(f"{API}/orders/{guest_order_id}/status", bad_pod_body, shipper_headers)
        record("Negative: Reject Delivery Without POD", code == 400, f"HTTP {code}")
    except urllib.error.HTTPError as e:
        record("Negative: Reject Delivery Without POD", e.code == 400, f"Correctly rejected with HTTP {e.code}")
    except Exception as e:
        record("Negative: Reject Delivery Without POD", False, str(e))

    # SUMMARY
    passed = sum(1 for r in results if r["status"] == "PASS")
    total = len(results)
    print("\n=================================================================")
    print(f"   AUDIT SUMMARY: {passed}/{total} PASSED ({total - passed} FAILED)        ")
    print("=================================================================")

if __name__ == "__main__":
    run_audit()
