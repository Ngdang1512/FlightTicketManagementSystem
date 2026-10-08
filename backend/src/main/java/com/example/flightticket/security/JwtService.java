package com.example.flightticket.security;

import com.example.flightticket.entity.Account;
import com.example.flightticket.entity.AccountRole;
import com.example.flightticket.exception.UnauthorizedException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final Duration accessTokenDuration;
    private final Duration refreshTokenDuration;
    private final Clock clock;

    @Autowired
    public JwtService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-minutes}") long accessTokenMinutes,
            @Value("${app.jwt.refresh-token-days}") long refreshTokenDays) {
        this(objectMapper, secret, accessTokenMinutes, refreshTokenDays, Clock.systemUTC());
    }

    JwtService(
            ObjectMapper objectMapper,
            String secret,
            long accessTokenMinutes,
            long refreshTokenDays,
            Clock clock) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT secret must contain at least 32 bytes");
        }
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.accessTokenDuration = Duration.ofMinutes(accessTokenMinutes);
        this.refreshTokenDuration = Duration.ofDays(refreshTokenDays);
        this.clock = clock;
    }

    public String createAccessToken(Account account) {
        return createToken(account, "access", accessTokenDuration);
    }

    public String createRefreshToken(Account account) {
        return createToken(account, "refresh", refreshTokenDuration);
    }

    public JwtPrincipal parseAccessToken(String token) {
        return parseToken(token, "access");
    }

    public JwtPrincipal parseRefreshToken(String token) {
        return parseToken(token, "refresh");
    }

    public long getAccessTokenExpiresInSeconds() {
        return accessTokenDuration.toSeconds();
    }

    public long getRefreshTokenExpiresInSeconds() {
        return refreshTokenDuration.toSeconds();
    }

    private String createToken(Account account, String type, Duration duration) {
        Instant now = clock.instant();
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", account.getUsername());
        claims.put("accountId", account.getId());
        claims.put("role", account.getRole().name());
        claims.put("type", type);
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", now.plus(duration).getEpochSecond());

        try {
            String header = encode(objectMapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
            String payload = encode(objectMapper.writeValueAsBytes(claims));
            String content = header + "." + payload;
            return content + "." + encode(sign(content));
        } catch (GeneralSecurityException | JsonProcessingException exception) {
            throw new IllegalStateException("Could not create JWT", exception);
        }
    }

    private JwtPrincipal parseToken(String token, String expectedType) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Malformed token");
            }

            String content = parts[0] + "." + parts[1];
            if (!MessageDigest.isEqual(sign(content), BASE64_URL_DECODER.decode(parts[2]))) {
                throw new IllegalArgumentException("Invalid token signature");
            }

            JsonNode header = objectMapper.readTree(BASE64_URL_DECODER.decode(parts[0]));
            JsonNode claims = objectMapper.readTree(BASE64_URL_DECODER.decode(parts[1]));
            if (!"HS256".equals(header.path("alg").asText())
                    || !expectedType.equals(claims.path("type").asText())
                    || claims.path("exp").asLong() <= clock.instant().getEpochSecond()) {
                throw new IllegalArgumentException("Invalid or expired token");
            }

            return new JwtPrincipal(
                    claims.path("accountId").asLong(),
                    claims.path("sub").asText(),
                    AccountRole.valueOf(claims.path("role").asText()));
        } catch (GeneralSecurityException | IOException | RuntimeException exception) {
            throw new UnauthorizedException("Invalid or expired token", exception);
        }
    }

    private byte[] sign(String content) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(content.getBytes(StandardCharsets.US_ASCII));
    }

    private String encode(byte[] value) {
        return BASE64_URL_ENCODER.encodeToString(value);
    }
}
