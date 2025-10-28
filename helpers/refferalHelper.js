

function generateReferralCode(name) {

    const namePart = name.slice(0, 3).toUpperCase();

    const randomPart = Math.floor(10000 + Math.random() * 90000);

    return `${namePart}${randomPart}`;

}

function generateUniqueCouponCode() {

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export { generateReferralCode, generateUniqueCouponCode }