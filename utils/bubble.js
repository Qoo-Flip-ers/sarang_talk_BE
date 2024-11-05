export function generateUniqueOrderId() {
    const timestamp = Date.now().toString();
    const randomComponent = Math.random().toString(36).substring(2);
    const fullHash = hashValue(timestamp + randomComponent);
    return fullHash.substring(0, 9);
}