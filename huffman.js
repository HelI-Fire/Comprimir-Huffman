// Variable global para almacenar el árbol actual y poder descomprimir
let arbolHuffmanActual = null;
let textoOriginalGuardado = "";

// 1. Lógica para leer archivos .txt automáticamente
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('input-text').value = e.target.result;
        };
        reader.readAsText(file);
    }
});

// ==========================================
// MÓDULO INTEGRANTE 1: Lógica Core de Huffman
// ==========================================

function calcularFrecuencias(texto) {
    const freqMap = {};
    for (let char of texto) {
        freqMap[char] = (freqMap[char] || 0) + 1;
    }
    return freqMap;
}

class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function construirArbolHuffman(freqMap) {
    let nodes = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));

    if (nodes.length === 0) return null;

    if (nodes.length === 1) {
        nodes.push(new Node(null, 0));
    }

    while (nodes.length > 1) {
        nodes.sort((a, b) => a.freq - b.freq);

        const left = nodes.shift();
        const right = nodes.shift();
        const parent = new Node(null, left.freq + right.freq, left, right);

        nodes.push(parent);
    }

    return nodes[0];
}

function generarCodigosHuffman(nodoRaiz) {
    const huffmanCodes = {};

    function traverse(node, code) {
        if (!node) return;
        if (node.char !== null) {
            huffmanCodes[node.char] = code || "0";
        }
        traverse(node.left, code + "0");
        traverse(node.right, code + "1");
    }

    traverse(nodoRaiz, "");
    return huffmanCodes;
}

// ==========================================
// MÓDULO DESCOMPRESIÓN (Pruebas de Integridad)
// ==========================================

function descomprimirHuffman(textoComprimido, nodoRaiz) {
    if (!nodoRaiz || !textoComprimido) return "";

    // Caso especial: sólo 1 tipo de carácter en todo el texto
    if (!nodoRaiz.left && !nodoRaiz.right && nodoRaiz.char !== null) {
        return nodoRaiz.char.repeat(textoComprimido.length);
    }

    let textoDescomprimido = "";
    let nodoActual = nodoRaiz;

    for (let bit of textoComprimido) {
        if (bit === '0') {
            nodoActual = nodoActual.left;
        } else if (bit === '1') {
            nodoActual = nodoActual.right;
        }

        if (nodoActual && nodoActual.char !== null) {
            textoDescomprimido += nodoActual.char;
            nodoActual = nodoRaiz;
        }
    }

    return textoDescomprimido;
}

// ==========================================
// NUEVO MÓDULO: Cálculo de Bytes y Porcentaje
// ==========================================

function calcularEstadisticasCompresion(textoOriginal, cadenaBits) {
    // 1. Tamaño original en Bytes (UTF-8)
    const bytesOriginales = new TextEncoder().encode(textoOriginal).length;

    // 2. Tamaño codificado en Bytes (8 bits = 1 Byte)
    const bytesCodificados = Math.ceil(cadenaBits.length / 8);

    // 3. Porcentaje de reducción/compresión
    let porcentajeReduccion = 0;
    if (bytesOriginales > 0) {
        porcentajeReduccion = ((1 - (bytesCodificados / bytesOriginales)) * 100).toFixed(2);
    }

    return {
        bytesOriginales,
        bytesCodificados,
        porcentajeReduccion: Math.max(0, porcentajeReduccion) // Evita valores negativos
    };
}

// ==========================================
// INTEGRACIÓN Y MOSTRAR RESULTADOS EN GUI
// ==========================================

// 3. Compresión y muestra de resultados
document.getElementById('btn-compress').addEventListener('click', () => {
    const text = document.getElementById('input-text').value;
    if (!text) {
        alert("Por favor, ingresa un texto o sube un archivo .txt para comprimir.");
        return;
    }

    textoOriginalGuardado = text;
    const freqMap = calcularFrecuencias(text);
    arbolHuffmanActual = construirArbolHuffman(freqMap);
    const huffmanCodes = generarCodigosHuffman(arbolHuffmanActual);

    let compressedText = "";
    for (let char of text) {
        compressedText += huffmanCodes[char];
    }
    document.getElementById('output-text').value = compressedText;

    actualizarTabla(freqMap, huffmanCodes);
    actualizarEstadisticas(text, compressedText);
});

// 4. Descompresión y verificación final
document.getElementById('btn-decompress').addEventListener('click', () => {
    const compressedText = document.getElementById('output-text').value;
    if (!compressedText || !arbolHuffmanActual) {
        alert("Primero debes comprimir un texto para generar el árbol de Huffman.");
        return;
    }

    const textoRestaurado = descomprimirHuffman(compressedText, arbolHuffmanActual);

    // Pruebas finales de integridad
    const esIdentico = (textoRestaurado === textoOriginalGuardado);

    if (esIdentico) {
        alert("✔ PRUEBA EXITOSA: El texto decodificado es 100% IDÉNTICO al original.\n\nLongitud: " + textoRestaurado.length + " caracteres.");
    } else {
        alert("❌ ERROR DE INTEGRIDAD: El texto decodificado NO coincide con el original.");
    }

    // Muestra el texto restaurado en la entrada para inspección
    document.getElementById('input-text').value = textoRestaurado;
});

// 5. Botón de Limpiar
document.getElementById('btn-clear').addEventListener('click', () => {
    arbolHuffmanActual = null;
    textoOriginalGuardado = "";
    document.getElementById('file-input').value = ""; 
    document.getElementById('input-text').value = "";
    document.getElementById('output-text').value = "";
    document.getElementById('huffman-body').innerHTML = '<tr><td colspan="3" class="vacio">Esperando texto...</td></tr>';
    document.getElementById('stat-orig').innerText = "0 bytes";
    document.getElementById('stat-comp').innerText = "0 bytes";
    document.getElementById('stat-ratio').innerText = "0%";
});

function actualizarTabla(freqMap, huffmanCodes) {
    const tbody = document.getElementById('huffman-body');
    tbody.innerHTML = "";

    const sortedChars = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);

    sortedChars.forEach(char => {
        const tr = document.createElement('tr');

        let displayChar = char;
        if (char === " ") displayChar = "[Espacio]";
        else if (char === "\n") displayChar = "[Salto de línea]";
        else if (char === "\r") displayChar = "[Retorno de carro]";
        else if (char === "\t") displayChar = "[Tabulación]";

        tr.innerHTML = `
            <td>${displayChar}</td>
            <td>${freqMap[char]}</td>
            <td>${huffmanCodes[char]}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarEstadisticas(textoOriginal, compressedBits) {
    const stats = calcularEstadisticasCompresion(textoOriginal, compressedBits);

    // Muestra de resultados en bytes y porcentaje
    document.getElementById('stat-orig').innerText = `${stats.bytesOriginales.toLocaleString()} bytes`;
    document.getElementById('stat-comp').innerText = `${stats.bytesCodificados.toLocaleString()} bytes`;
    document.getElementById('stat-ratio').innerText = `${stats.porcentajeReduccion}%`;
}