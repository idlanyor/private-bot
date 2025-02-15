// variabel dasar
globalThis.owner = "Roy";
globalThis.ownerNumber = ["62895395590009","6285328913428"]
globalThis.botNumber = "62895395590009"
globalThis.sessionName = 'private-bot'

// fungsi dasar
globalThis.isOwner = (notel) => {
    return globalThis.ownerNumber.includes(notel)
}
globalThis.isBot = async (id) => {
    return id === botNumber
}

globalThis.isGroup = (jid) => {
    return jid.endsWith('@g.us')
}