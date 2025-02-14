export const ownerNumbers = [
    '62895395590009@s.whatsapp.net',
];

export const isOwner = (number) => {
    return globalThis.isOwner(number);
};

export const checkOwner = async (sock, id, noTel) => {
    console.log(noTel)
    if (!isOwner(noTel)) {
        await sock.sendMessage(id, { text: '❌ Command ini hanya untuk owner bot!' });
        return false;
    }
    console.log(globalThis.isOwner(noTel))
    return true;
}; 