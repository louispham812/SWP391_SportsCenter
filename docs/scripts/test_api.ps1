$loginBody = @{ 
    email = 'ngoc.hoang@gmail.com'
    password = 'SportHub@123'
    role = 'MEMBER' 
} | ConvertTo-Json
$auth = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "Login: OK | User: $($auth.fullName) | Role: $($auth.role)"
$headers = @{ Authorization = "Bearer " + $auth.token }

# 1. Quote
$quote = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/booking-flow/quote?bookingType=CLASS&itemId=6' -Method Get -Headers $headers
Write-Host "1. Quote: Base=$($quote.basePrice) | DiscountRate=$($quote.discountRate) | Final=$($quote.finalPrice) | Reason=$($quote.discountReason)"

# 2. Checkout Class with VIETQR
$checkoutBody = @{
    bookingType = 'CLASS'
    itemId = 6
    paymentMethod = 'VIETQR'
    notes = 'Dang ky lop test VIETQR'
} | ConvertTo-Json
$checkout = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/booking-flow/checkout' -Method Post -Headers $headers -Body $checkoutBody -ContentType 'application/json'
Write-Host "2. Class Checkout: BookingId=$($checkout.bookingId) | RefCode=$($checkout.paymentReferenceCode) | Final=$($checkout.finalAmount) | Status=$($checkout.bookingStatus)"

# 3. Cancel & Refund
if ($checkout.bookingId) {
    $cancelResp = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/booking-flow/schedule/CLASS/$($checkout.bookingId)" -Method Delete -Headers $headers
    Write-Host "3. Cancel Booking: Status Code = $($cancelResp.StatusCode) (No Content / Success)"
}

# 4. Package Upgrade to VIP Diamond (Package 1) with VIETQR
$pkgBody = @{
    packageId = 1
    paymentMethod = 'VIETQR'
} | ConvertTo-Json
$pkgRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/members/me/memberships' -Method Post -Headers $headers -Body $pkgBody -ContentType 'application/json'
Write-Host "4. Package Upgrade: PkgName=$($pkgRes.packageName) | Amount=$($pkgRes.amount) | RefCode=$($pkgRes.referenceCode)"

# 5. List Transactions
$txs = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/members/me/transactions' -Method Get -Headers $headers
Write-Host "5. Transactions count: $($txs.Count)"
$txs | Select-Object -First 3 | ForEach-Object {
    Write-Host "   -> Ref: $($_.referenceCode) | Type: $($_.bookingType) | Amount: $($_.amount) | Method: $($_.paymentMethod) | Status: $($_.status)"
}
