// variabel dasar
globalThis.owner = "Roy";
globalThis.ownerNumber = "62895395590009"
globalThis.botNumber = "62895395590009"
globalThis.sessionName = 'Roy'

// fungsi dasar
globalThis.isOwner = (id) => {
    return id === globalThis.ownerNumber
}
globalThis.isBot = async (id) => {
    return id === botNumber
}

globalThis.isGroup = (jid) => {
    return jid.endsWith('@g.us')
}