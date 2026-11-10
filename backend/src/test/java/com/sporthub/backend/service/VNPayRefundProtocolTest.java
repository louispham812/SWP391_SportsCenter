package com.sporthub.backend.service;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.service.gateway.VNPayGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.net.http.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class VNPayRefundProtocolTest {
    private final VNPayGateway gateway = new VNPayGateway();
    private final HttpClient client = mock(HttpClient.class);
    private final com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper();
    private final List<Map<String, Object>> requests = new ArrayList<>();
    private final PaymentTransaction payment = new PaymentTransaction();
    private boolean corruptSignature;
    private boolean wrongAmount;
    private int httpStatus = 200;

    @BeforeEach @SuppressWarnings("unchecked")
    void setup() throws Exception {
        ReflectionTestUtils.setField(gateway, "tmnCode", "TESTCODE"); ReflectionTestUtils.setField(gateway, "hashSecret", "test-secret");
        ReflectionTestUtils.setField(gateway, "vnpayApiUrl", "https://gateway.test/refund"); ReflectionTestUtils.setField(gateway, "refundClient", client);
        ReflectionTestUtils.setField(VNPayGateway.class, "clockOffsetMillis", 0L); ReflectionTestUtils.setField(VNPayGateway.class, "lastOffsetFetch", System.currentTimeMillis());
        payment.setPaymentId(2L); payment.setAmount(BigDecimal.TEN); payment.setGatewayReference("2_attempt_one");
        payment.setReferenceCode("12345678"); payment.setTransactionDate("20261109115900");
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenAnswer(i -> {
            HttpRequest request = i.getArgument(0); assertEquals("application/json", request.headers().firstValue("Content-Type").orElseThrow());
            Map<String, Object> body = json.readValue(body(request), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}); requests.add(body);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("vnp_ResponseId", "reply1"); result.put("vnp_Command", "refund"); result.put("vnp_ResponseCode", "00"); result.put("vnp_Message", "Success");
            result.put("vnp_TmnCode", "TESTCODE"); result.put("vnp_TxnRef", body.get("vnp_TxnRef")); result.put("vnp_Amount", wrongAmount ? 999 : 1000);
            result.put("vnp_BankCode", "NCB"); result.put("vnp_PayDate", "20261109121000"); result.put("vnp_TransactionNo", "98765432");
            result.put("vnp_TransactionType", "02"); result.put("vnp_TransactionStatus", "00"); result.put("vnp_OrderInfo", body.get("vnp_OrderInfo"));
            String raw = "reply1|refund|00|Success|TESTCODE|" + body.get("vnp_TxnRef") + "|" + result.get("vnp_Amount") + "|NCB|20261109121000|98765432|02|00|" + body.get("vnp_OrderInfo");
            result.put("vnp_SecureHash", corruptSignature ? "invalid" : hmac(raw));
            HttpResponse<String> response = mock(HttpResponse.class); when(response.statusCode()).thenReturn(httpStatus); when(response.body()).thenReturn(json.writeValueAsString(result)); return response;
        });
    }
    @Test void refundUsesDocumentedJsonFieldsPipeChecksumAndVerifiedResponse() throws Exception {
        Map<String, Object> result = gateway.refundPayment(payment, BigDecimal.TEN, "Hoàn khoản dư", "receipt:one");
        assertEquals("00", result.get("vnp_ResponseCode")); Map<String, Object> r = requests.getFirst();
        assertEquals("2_attempt_one", r.get("vnp_TxnRef")); assertEquals("12345678", r.get("vnp_TransactionNo"));
        assertEquals("20261109115900", r.get("vnp_TransactionDate")); assertEquals("manager", r.get("vnp_CreateBy"));
        String raw = r.get("vnp_RequestId") + "|2.1.0|refund|TESTCODE|02|2_attempt_one|1000|12345678|20261109115900|manager|" + r.get("vnp_CreateDate") + "|127.0.0.1|Hoàn khoản dư";
        assertEquals(hmac(raw), r.get("vnp_SecureHash")); assertTrue(r.get("vnp_RequestId").toString().matches("[0-9a-f]{32}"));
    }
    @Test void successWithoutAuthenticMatchingResponseIsNotReportedAsRefunded() {
        corruptSignature = true; assertEquals("99", gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "one").get("vnp_ResponseCode"));
        corruptSignature = false; wrongAmount = true; assertEquals("99", gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "one").get("vnp_ResponseCode"));
        wrongAmount = false; httpStatus = 500; assertEquals("99", gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "one").get("vnp_ResponseCode"));
    }
    @Test void refundRequestIdentityIsStablePerReceiptAndDifferentAcrossReceipts() {
        gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "one"); gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "one");
        gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "two");
        assertEquals(requests.get(0).get("vnp_RequestId"), requests.get(1).get("vnp_RequestId")); assertNotEquals(requests.get(0).get("vnp_RequestId"), requests.get(2).get("vnp_RequestId"));
    }
    @Test void missingOriginalMerchantDateRequiresReconciliationWithoutCallingGateway() {
        payment.setTransactionDate(null); assertEquals("99", gateway.refundPayment(payment, BigDecimal.TEN, "Refund", "one").get("vnp_ResponseCode"));
        verifyNoInteractions(client);
    }
    private String hmac(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512"); mac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
    private String body(HttpRequest request) throws Exception {
        var output = new java.io.ByteArrayOutputStream(); var finished = new CompletableFuture<String>();
        request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<ByteBuffer>() {
            public void onSubscribe(Flow.Subscription s) { s.request(Long.MAX_VALUE); }
            public void onNext(ByteBuffer data) { byte[] bytes = new byte[data.remaining()]; data.get(bytes); output.writeBytes(bytes); }
            public void onError(Throwable error) { finished.completeExceptionally(error); }
            public void onComplete() { finished.complete(output.toString(StandardCharsets.UTF_8)); }
        });
        return finished.get(2, TimeUnit.SECONDS);
    }
}
