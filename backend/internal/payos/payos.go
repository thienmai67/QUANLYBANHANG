package payos

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	ClientID    string
	APIKey      string
	ChecksumKey string
	BaseURL     string
	HTTPClient  *http.Client
}

func NewClient(clientID, apiKey, checksumKey string) *Client {
	return &Client{
		ClientID:    clientID,
		APIKey:      apiKey,
		ChecksumKey: checksumKey,
		BaseURL:     "https://api-merchant.payos.vn",
		HTTPClient:  &http.Client{Timeout: 15 * time.Second},
	}
}

type PayOSResponse[T any] struct {
	Code string `json:"code"`
	Desc string `json:"desc"`
	Data T      `json:"data"`
}

type CreatePaymentRequestPayload struct {
	OrderCode   int64  `json:"orderCode"`
	Amount      int    `json:"amount"`
	Description string `json:"description"`
	CancelURL   string `json:"cancelUrl"`
	ReturnURL   string `json:"returnUrl"`
	Signature   string `json:"signature"`
}

type PaymentLinkData struct {
	Bin           string `json:"bin"`
	AccountNumber string `json:"accountNumber"`
	AccountName   string `json:"accountName"`
	Amount        int    `json:"amount"`
	Description   string `json:"description"`
	OrderCode     int64  `json:"orderCode"`
	Currency      string `json:"currency"`
	PaymentLinkID string `json:"paymentLinkId"`
	Status        string `json:"status"`
	CheckoutURL   string `json:"checkoutUrl"`
	QRCode        string `json:"qrCode"`
}

type PaymentStatusData struct {
	ID                 string `json:"id"`
	OrderCode          int64  `json:"orderCode"`
	Amount             int    `json:"amount"`
	AmountPaid         int    `json:"amountPaid"`
	AmountRemaining    int    `json:"amountRemaining"`
	Status             string `json:"status"`
	CreatedAt          string `json:"createdAt"`
	CanceledAt         string `json:"canceledAt,omitempty"`
	CancellationReason string `json:"cancellationReason,omitempty"`
}

func (c *Client) GenerateSignature(amount int, cancelURL, description string, orderCode int64, returnURL string) string {
	data := fmt.Sprintf("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
		amount, cancelURL, description, orderCode, returnURL)
	h := hmac.New(sha256.New, []byte(c.ChecksumKey))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func (c *Client) CreatePaymentLink(ctx context.Context, orderCode int64, amount int, description, cancelURL, returnURL string) (*PaymentLinkData, error) {
	if c.ClientID == "" || c.APIKey == "" || c.ChecksumKey == "" {
		return nil, errors.New("payos credentials are not configured")
	}

	sig := c.GenerateSignature(amount, cancelURL, description, orderCode, returnURL)
	payload := CreatePaymentRequestPayload{
		OrderCode:   orderCode,
		Amount:      amount,
		Description: description,
		CancelURL:   cancelURL,
		ReturnURL:   returnURL,
		Signature:   sig,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal payment request: %w", err)
	}

	reqURL := fmt.Sprintf("%s/v2/payment-requests", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create http request: %w", err)
	}

	req.Header.Set("x-client-id", c.ClientID)
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute payment request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	var payosResp PayOSResponse[PaymentLinkData]
	if err := json.Unmarshal(respBody, &payosResp); err != nil {
		return nil, fmt.Errorf("unmarshal payos response (%s): %w", string(respBody), err)
	}

	if payosResp.Code != "00" {
		return nil, fmt.Errorf("payos error [%s]: %s", payosResp.Code, payosResp.Desc)
	}

	return &payosResp.Data, nil
}

func (c *Client) GetPaymentStatus(ctx context.Context, orderCode int64) (*PaymentStatusData, error) {
	if c.ClientID == "" || c.APIKey == "" {
		return nil, errors.New("payos credentials are not configured")
	}

	reqURL := fmt.Sprintf("%s/v2/payment-requests/%d", c.BaseURL, orderCode)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create http request: %w", err)
	}

	req.Header.Set("x-client-id", c.ClientID)
	req.Header.Set("x-api-key", c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute get status request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	var payosResp PayOSResponse[PaymentStatusData]
	if err := json.Unmarshal(respBody, &payosResp); err != nil {
		return nil, fmt.Errorf("unmarshal payos status response (%s): %w", string(respBody), err)
	}

	if payosResp.Code != "00" {
		return nil, fmt.Errorf("payos error [%s]: %s", payosResp.Code, payosResp.Desc)
	}

	return &payosResp.Data, nil
}

func (c *Client) CancelPayment(ctx context.Context, orderCode int64, reason string) error {
	if c.ClientID == "" || c.APIKey == "" {
		return errors.New("payos credentials are not configured")
	}

	payload := map[string]string{
		"cancellationReason": reason,
	}
	bodyBytes, _ := json.Marshal(payload)

	reqURL := fmt.Sprintf("%s/v2/payment-requests/%d/cancel", c.BaseURL, orderCode)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("create cancel request: %w", err)
	}

	req.Header.Set("x-client-id", c.ClientID)
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("execute cancel request: %w", err)
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	return nil
}
