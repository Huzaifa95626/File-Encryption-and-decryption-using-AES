async function getKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "IIUI",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptFile() {
    const file = document.getElementById("fileInput").files[0];
    const password = document.getElementById("password").value;

    if (!file || !password) {
        alert("Please select file and enter password");
        return;
    }

    const data = await file.arrayBuffer();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await getKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    const blob = new Blob([salt, iv, new Uint8Array(encrypted)]);
    download(blob, file.name + ".enc");

    document.getElementById("status").innerText = "File Encrypted Successfully";
}

async function decryptFile() {
    const file = document.getElementById("fileInput").files[0];
    const password = document.getElementById("password").value;

    if (!file || !password) {
        alert("Please select encrypted file and enter password");
        return;
    }

    const buffer = await file.arrayBuffer();
    const salt = buffer.slice(0, 16);
    const iv = buffer.slice(16, 28);
    const data = buffer.slice(28);

    const key = await getKey(password, new Uint8Array(salt));

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            key,
            data
        );

        const blob = new Blob([decrypted]);
        download(blob, "decrypted_" + file.name.replace(".enc", ""));
        document.getElementById("status").innerText = "File Decrypted Successfully";
    } catch {
        alert("Wrong password or corrupted file");
    }
}

function download(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
