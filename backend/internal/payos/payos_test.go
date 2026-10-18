package payos

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClient_GenerateSignature(t *testing.T) {
	client := NewClient("client-123", "api-key-123", "secret-checksum-key")

	amount := 250000
	cancelURL := "http://localhost:3000/orders/cancel"
	description := "TDT240001"
	orderCode := int64(123456789)
	returnURL := "http://localhost:3000/orders/success"

	expectedData := "amount=250000&cancelUrl=http://localhost:3000/orders/cancel&description=TDT240001&orderCode=123456789&returnUrl=http://localhost:3000/orders/success"
	h := hmac.New(sha256.New, []byte("secret-checksum-key"))
	h.Write([]byte(expectedData))
	expectedSig := hex.EncodeToString(h.Sum(nil))

	actualSig := client.GenerateSignature(amount, cancelURL, description, orderCode, returnURL)
	if actualSig != expectedSig {
		t.Errorf("expected signature %s, got %s", expectedSig, actualSig)
	}
}

func TestClient_CreatePaymentLink(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-client-id") != "test-client" {
			t.Errorf("unexpected client id header: %s", r.Header.Get("x-client-id"))
		}
		if r.Header.Get("x-api-key") != "test-key" {
			t.Errorf("unexpected api key header: %s", r.Header.Get("x-api-key"))
		}

		resp := PayOSResponse[PaymentLinkData]{
			Code: "00",
			Desc: "success",
			Data: PaymentLinkData{
				OrderCode:   123456,
				Amount:      50000,
				Status:      "PENDING",
				CheckoutURL: "https://pay.payos.vn/web/123456",
				QRCode:      "00020101021238540010A000000727012600069704220112123456789053037045405500005802VN62160812TDT2400016304ABCD",
			},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client := NewClient("test-client", "test-key", "test-checksum")
	client.BaseURL = server.URL
	client.HTTPClient = server.Client()

	link, err := client.CreatePaymentLink(context.Background(), 123456, 50000, "TDT240001", "http://cancel", "http://return")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if link.QRCode == "" || link.CheckoutURL == "" {
		t.Errorf("expected qrCode and checkoutUrl to be populated, got %+v", link)
	}
}

func TestClient_GetPaymentStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := PayOSResponse[PaymentStatusData]{
			Code: "00",
			Desc: "success",
			Data: PaymentStatusData{
				OrderCode: 123456,
				Amount:    50000,
				Status:    "PAID",
			},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client := NewClient("test-client", "test-key", "test-checksum")
	client.BaseURL = server.URL
	client.HTTPClient = server.Client()

	status, err := client.GetPaymentStatus(context.Background(), 123456)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if status.Status != "PAID" {
		t.Errorf("expected status PAID, got %s", status.Status)
	}
}
