import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import {
  FondoData,
  FundAPI,
  PortfolioData,
  PosicionData,
  TransaccionAPI,
  TransaccionData,
} from "./interface";

// Función para convertir los datos de la API al formato de la tabla
const transformFundsData = (funds: FundAPI[]): FondoData[] => {
  return funds
    .filter((fund) => fund.id !== "cash") // Filtrar los fondos tipo "cash"
    .map((fund) => {
      // Construir nombre del fondo: id + serie (si existe)
      const nombreFondo = fund.series ? `${fund.id} ${fund.series}` : fund.id;

      // Convertir moneda a símbolo
      const moneda = fund.currency === "USD" ? "$" : "s/";

      // Ahorros: balance.amount
      const ahorros = fund.balance.amount;

      // Aportes: balance.amount * costBasis (o 0 si no existe)
      const aporte = fund.costBasis ? fund.balance.amount * fund.costBasis : 0;

      // Rentabilidad: por ahora 0
      const rentabilidad = 0;

      return {
        fondo: nombreFondo,
        moneda: moneda as "s/" | "$",
        ahorros,
        aporte,
        rentabilidad,
      };
    });
};

// Función para convertir los datos del portafolio a las posiciones de la tabla
const transformPortfolioData = (
  portfolioData: PortfolioData
): PosicionData[] => {
  return portfolioData.portfolio.funds
    .filter((fund) => fund.id !== "cash") // Filtrar los fondos tipo "cash"
    .map((fund) => {
      // Fondo: id + serie (si existe)
      const nombreFondo = fund.series ? `${fund.id} ${fund.series}` : fund.id;

      // Saldo al: formattedDate
      const saldoAl = portfolioData.formattedDate;

      // N° de cuotas: balance.shares (o 0 si no existe)
      const numCuotas = fund.balance.shares || 0;

      // Valor cuota: sharePrice (o 0 si no existe)
      const valorCuota = fund.sharePrice || 0;

      // Moneda: balance.currency
      const moneda = fund.balance.currency;

      // Saldo: balance.amount
      const saldo = fund.balance.amount;

      // Saldo en USD: si es USD, mismo saldo; si es PEN, asumir conversión (por ahora 1:1)
      // Podrías agregar un tipo de cambio si lo necesitas
      const saldoUSD = moneda === "USD" ? saldo : saldo; // Ajustar según necesidad

      return {
        fondo: nombreFondo,
        saldoAl,
        numCuotas,
        valorCuota,
        moneda,
        saldo,
        saldoUSD,
      };
    });
};

// Función para convertir timestamp a fecha legible
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Función para transformar transacciones de la API al formato de la tabla
const transformTransaccionesData = (
  transacciones: TransaccionAPI[]
): TransaccionData[] => {
  return transacciones.map((transaccion) => {
    // Fecha de solicitud: creationDate formateado
    const fechaSolicitud = formatDate(transaccion.creationDate);

    // Fecha de asignación: priceDate formateado
    const fechaAsignacion = formatDate(transaccion.priceDate);

    // Fondo mutuo: fund.id + fund.series
    const fondoMutuo = `${transaccion.fund.id} ${transaccion.fund.series}`;

    // Tipo de movimiento: traducir type
    const tipoMovimientoMap: { [key: string]: string } = {
      BUY: "Compra",
      SELL: "Venta",
      TRANSFER_IN: "Transferencia Entrada",
      TRANSFER_OUT: "Transferencia Salida",
    };
    const tipoMovimiento =
      tipoMovimientoMap[transaccion.type] || transaccion.type;

    // Número de cuotas: shares (o 0 si no existe)
    const numCuotas = transaccion.shares || 0;

    // Valor cuota: price (o 0 si no existe)
    const valorCuota = transaccion.price || 0;

    // Moneda: currency
    const moneda = transaccion.currency;

    // Monto: amount
    const monto = transaccion.amount;

    return {
      fechaSolicitud,
      fechaAsignacion,
      fondoMutuo,
      tipoMovimiento,
      numCuotas,
      valorCuota,
      moneda,
      monto,
    };
  });
};

const doc = new PDFDocument({
  size: "A4",
  layout: "landscape",
  margin: 20,
});

const subTitulo = (doc: any, text: string) => {
  doc.font("roboto-bold").fontSize(28).fillColor("#1d113e").text(text, 50, 60, {
    align: "left",
    width: doc.page.width,
  });
};

const portada = (doc: any) => {
  // ✅ Fondo que cubre toda la página
  doc.image("img/fondo.jpeg", 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });
  // ---- TÍTULO ----
  doc
    .font("roboto-bold")
    .fontSize(48)
    .fillColor("white")
    .text("Estado de", 0, 280, {
      align: "center",
      width: doc.page.width,
    });

  doc
    .font("roboto-bold")
    .fontSize(48)
    .fillColor("white")
    .text("cuenta", -34, 320, {
      align: "center",
      width: doc.page.width,
    });

  // ---- SUBTÍTULO ----
  doc
    .font("roboto-bold")
    .fontSize(32)
    .fillColor("#40c06f") // verde similar al original
    .text("OCTUBRE 2025", 4, 390, {
      align: "center",
      width: doc.page.width,
    });
};

const marcaDeAgua = (doc: any) => {
  doc.image("img/BlumLogo.png", 20, 15, {
    width: 40,
  });

  // Texto del usuario (DNI + nombre)
  const userText = "DNI99999999 - John Doe Test ";

  // Fecha FIJA (cerca del borde derecho)
  const dateText = "1/Oct/2025 - 31/Oct/2025";
  const dateX = doc.page.width - 115; // Posición fija de la fecha (100px desde el borde derecho)

  // Espacio entre el nombre y la fecha
  const spacing = 20;

  // Configurar fuentes para medir correctamente
  doc.font("roboto-medium").fontSize(8);
  const userTextWidth = doc.widthOfString(userText);

  // Calcular posición dinámica del nombre (hacia la izquierda de la fecha)
  const userTextX = dateX - userTextWidth - spacing;

  doc.fillColor("#000000").text(userText, userTextX, 20, {
    lineBreak: false,
    continued: false,
  });

  doc
    .font("roboto-regular")
    .fontSize(8)
    .fillColor("#000000")
    .text(dateText, dateX, 20, {
      lineBreak: false,
    });
};

const resumenPortafolio = (doc: any, fondosData: FondoData[]) => {
  // Agregar nueva página
  doc.addPage();
  // ✅ Marca de agua
  marcaDeAgua(doc);

  // Titulo de la seccion
  subTitulo(doc, "Resumen de tu portafolio");

  const barMargin = 50;
  const { columnX, columnWidths } = cabeceraTabla(doc, barMargin, [
    { label: "N°", width: 0.05 },
    { label: "FONDO", width: 0.38 },
    { label: "MONEDA", width: 0.1 },
    { label: "AHORROS", width: 0.16 },
    { label: "APORTE", width: 0.15 },
    { label: "RENTABILIDAD", width: 0.16 },
  ]);

  const rowBackgroundHeight = 20; // Altura del fondo de la fila
  const rowMargin = 1.5; // Margen entre filas (más delgado)
  const fontSize = 10; // Tamaño de fuente
  const textVerticalOffset = (rowBackgroundHeight - fontSize) / 2 - 2; // Centrado vertical

  fondosData.forEach((fondo, rowIndex) => {
    // Posición Y de la fila (incluye margen antes de la primera fila)
    const rowY = 140 + rowMargin + rowIndex * (rowBackgroundHeight + rowMargin);

    // Dibujar fondo de la fila
    doc
      .rect(
        barMargin,
        rowY,
        doc.page.width - barMargin * 2,
        rowBackgroundHeight
      )
      .fill("#efefef");

    // Restaurar color del texto después de dibujar el fondo
    doc.fillColor("#000000");

    // Formatear valores
    const numeroFila = (rowIndex + 1).toString();
    const ahorrrosFormateado = fondo.ahorros.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const aporteFormateado = fondo.aporte.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const rentabilidadFormateada = `${fondo.rentabilidad.toFixed(2)} %`;

    const row = [
      numeroFila,
      fondo.fondo,
      fondo.moneda,
      ahorrrosFormateado,
      aporteFormateado,
      rentabilidadFormateada,
    ];

    // Posición Y del texto (centrado verticalmente en el fondo)
    const textY = rowY + textVerticalOffset;

    row.forEach((value, colIndex) => {
      // Columna FONDO (índice 1) alineada a la izquierda, el resto centradas
      if (colIndex === 1) {
        // FONDO: alineado a la izquierda
        doc.text(value, columnX[colIndex] + 5, textY, {
          width: columnWidths[colIndex] - 10,
          align: "left",
        });
      } else {
        // Resto de columnas: centradas usando el ancho de la columna
        doc.text(value, columnX[colIndex], textY, {
          width: columnWidths[colIndex],
          align: "center",
        });
      }
    });
  });

  distribuciones(doc, doc.page.height - 205 - 30);
};

const drawPieChart = (
  doc: any,
  centerX: number,
  centerY: number,
  radius: number,
  data: { label: string; value: number }[],
  colors: string[]
) => {
  // Calcular el total
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Dibujar el pie chart
  let currentAngle = -90; // Comenzar desde arriba (12 en punto) en grados

  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 360;
    const endAngle = currentAngle + sliceAngle;

    // Convertir ángulos a radianes para los cálculos
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calcular punto inicial en el borde
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);

    // Calcular punto final en el borde
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);

    // Determinar si es un arco grande (más de 180 grados)
    const largeArc = sliceAngle > 180 ? 1 : 0;

    // Dibujar el segmento usando path SVG
    doc
      .save()
      .fillColor(colors[index])
      .path(
        `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`
      )
      .fill()
      .restore();

    currentAngle = endAngle;
  });

  // Dibujar la leyenda
  const legendX = centerX + radius + 20;
  let legendY = centerY - (data.length * 18) / 2; // Centrar verticalmente

  data.forEach((item, index) => {
    const percentage = ((item.value / total) * 100).toFixed(1);

    // Cuadrado de color
    doc.rect(legendX, legendY + index * 18, 10, 10).fill(colors[index]);

    // Texto de la leyenda
    doc
      .font("roboto-regular")
      .fontSize(9)
      .fillColor("#000000")
      .text(
        `${item.label}: ${percentage}%`,
        legendX + 15,
        legendY + index * 18,
        { lineBreak: false }
      );
  });
};

const distribuciones = (doc: any, distributionY: number) => {
  const barMargin = 20;
  const barHeight = 30; // Misma altura que la barra del título
  const totalWidth = doc.page.width - barMargin * 2;
  const halfWidth = totalWidth / 2;

  doc
    .font("roboto-bold")
    .fontSize(18)
    .fillColor("#1d113e")
    .text("Distribución por moneda", barMargin, distributionY + 9, {
      width: halfWidth,
      align: "center",
    });

  // DISTRIBUCIÓN POR FONDO

  doc
    .font("roboto-bold")
    .fontSize(18)
    .fillColor("#1d113e")
    .text("Distribución por fondo", barMargin + halfWidth, distributionY + 9, {
      width: halfWidth,
      align: "center",
    });

  // Datos para los gráficos
  const coloresMoneda = ["#292243", "#7fc6b3"];
  const monedaData = [
    { label: "USD", value: 65 },
    { label: "PEN", value: 35 },
  ];

  const coloresFondo = [
    "#292243",
    "#7fc6b3",
    "#625ea7",
    "#c4b2d5",
    "#658dc2",
    "#daa76f",
    "#ddda9e",
    "#c1dfc5",
    "#a1d7ec",
  ];

  const fondoData = [
    { label: "Fondo USA 500", value: 45, color: "#62e28d" },
    { label: "Fondo Renta Global", value: 30, color: "#8a9aa2" },
    { label: "Fondo Balanceado", value: 25, color: "#292243" },
    { label: "Fondo Balanceado", value: 25, color: "#292243" },
    { label: "Fondo Balanceado", value: 25, color: "#292243" },
    { label: "Fondo Balanceado", value: 25, color: "#292243" },
    { label: "Fondo Balanceado", value: 25, color: "#292243" },
  ];

  // Posición de los gráficos (debajo de las barras)
  const chartY = distributionY + barHeight + 75;
  const chartRadius = 50;

  // Calcular el centro de cada sección para alinear con las cabeceras
  const leftChartCenterX = barMargin + halfWidth / 2;
  const rightChartCenterX = barMargin + halfWidth + halfWidth / 2;

  // Gráfico de distribución por moneda (izquierda) - centrado
  drawPieChart(
    doc,
    leftChartCenterX - 30,
    chartY,
    chartRadius,
    monedaData,
    coloresMoneda
  );

  // Gráfico de distribución por fondo (derecha) - centrado
  drawPieChart(
    doc,
    rightChartCenterX - 30,
    chartY,
    chartRadius,
    fondoData,
    coloresFondo
  );
};

const cabeceraTabla = (
  doc: any,
  barMargin: number,
  headers: {
    label: string;
    width: number;
  }[]
) => {
  const barHeight = 20;

  // Fondo encabezado
  doc
    .rect(barMargin, 120, doc.page.width - barMargin * 2, barHeight)
    .fill("#1d113e");

  // Calcular posiciones dinámicas de las columnas para ocupar todo el ancho
  const tableWidth = doc.page.width - barMargin * 2;
  const columnWidths = headers.map((h) => h.width * tableWidth);

  // Calcular posiciones X de cada columna
  const columnX: number[] = [];
  let currentX = barMargin; // Sin padding inicial para usar todo el ancho
  for (let i = 0; i < columnWidths.length; i++) {
    columnX.push(currentX);
    currentX += columnWidths[i];
  }

  doc.font("roboto-bold").fontSize(10).fillColor("white");

  headers.forEach((h, i) => {
    // FONDO (índice 1) alineado a la izquierda, resto centrados
    if (i === 1) {
      // FONDO: alineado a la izquierda
      doc.text(h.label, columnX[i] + 5, 120 + 5, {
        width: columnWidths[i] - 10,
        align: "left",
      });
    } else {
      // Resto: centrados usando el ancho de la columna
      doc.text(h.label, columnX[i], 120 + 5, {
        width: columnWidths[i],
        align: "center",
      });
    }
  });

  // Generar filas dinámicamente desde fondosData
  doc.font("roboto-regular").fontSize(10).fillColor("#000000");

  return { columnX, columnWidths };
};

const posicionesDelPortafolio = (
  doc: any,
  posicionesData: PosicionData[],
  posicionesData2?: PosicionData[]
) => {
  const barMargin = 50;
  const rowBackgroundHeight = 20; // Altura del fondo de la fila
  const rowMargin = 1.5; // Margen entre filas
  const fontSize = 10; // Tamaño de fuente
  const textVerticalOffset = (rowBackgroundHeight - fontSize) / 2 - 2; // Centrado vertical

  // Agrupar posiciones por moneda
  const posicionesPorMoneda: { [key: string]: PosicionData[] } = {
    PEN: [],
    USD: [],
  };

  posicionesData.forEach((posicion) => {
    if (posicion.moneda === "PEN") {
      posicionesPorMoneda.PEN.push(posicion);
    } else if (posicion.moneda === "USD") {
      posicionesPorMoneda.USD.push(posicion);
    }
  });

  // Cada tabla debe estar en su propia página
  doc.addPage();

  // ✅ Marca de agua
  marcaDeAgua(doc);

  // Titulo de la seccion
  subTitulo(doc, "Posiciones del portafolio");

  const { columnX, columnWidths } = cabeceraTabla(doc, barMargin, [
    { label: "N°", width: 0.05 },
    { label: "FONDO", width: 0.26 },
    { label: "SALDO AL", width: 0.14 },
    { label: "N° DE CUOTAS", width: 0.14 },
    { label: "VALOR CUOTA", width: 0.14 },
    { label: "SALDO", width: 0.14 },
    { label: "SALDO EN USD", width: 0.14 },
  ]);

  // Contador global de filas (para calcular el Y position)
  let currentRowIndex = 0;
  let globalRowNumber = 1; // Contador global de N° de fila

  // Función para dibujar una fila de encabezado de grupo
  const drawGroupHeader = (moneda: string, label: string) => {
    const rowY =
      140 + rowMargin + currentRowIndex * (rowBackgroundHeight + rowMargin);

    // Dibujar fondo de la fila con color diferente
    doc
      .rect(
        barMargin,
        rowY,
        doc.page.width - barMargin * 2,
        rowBackgroundHeight
      )
      .fill("#d0d0d0");

    // Texto del encabezado (en negrita)
    doc
      .font("roboto-bold")
      .fontSize(10)
      .fillColor("#000000")
      .text(label, columnX[1] + 5, rowY + textVerticalOffset, {
        width: columnWidths[1] - 10,
        align: "left",
      });

    doc.font("roboto-regular"); // Restaurar fuente normal
    currentRowIndex++;
  };

  // Función para dibujar una fila de datos
  const drawDataRow = (posicion: PosicionData, rowNum: number) => {
    const rowY =
      140 + rowMargin + currentRowIndex * (rowBackgroundHeight + rowMargin);

    // Dibujar fondo de la fila
    doc
      .rect(
        barMargin,
        rowY,
        doc.page.width - barMargin * 2,
        rowBackgroundHeight
      )
      .fill("#efefef");

    // Restaurar color del texto
    doc.fillColor("#000000");

    // Formatear valores
    const numeroFila = rowNum.toString();
    const numCuotasFormateado = posicion.numCuotas.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
    const valorCuotaFormateado = posicion.valorCuota.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
    const saldoFormateado = posicion.saldo.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const saldoUSDFormateado = posicion.saldoUSD.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const row = [
      numeroFila,
      posicion.fondo,
      posicion.saldoAl,
      numCuotasFormateado,
      valorCuotaFormateado,
      saldoFormateado,
      saldoUSDFormateado,
    ];

    // Posición Y del texto (centrado verticalmente en el fondo)
    const textY = rowY + textVerticalOffset;

    row.forEach((value, colIndex) => {
      // Columna FONDO (índice 1) alineada a la izquierda, el resto centradas
      if (colIndex === 1) {
        // FONDO: alineado a la izquierda
        doc.text(value, columnX[colIndex] + 5, textY, {
          width: columnWidths[colIndex] - 10,
          align: "left",
        });
      } else {
        // Resto de columnas: centradas
        doc.text(value, columnX[colIndex], textY, {
          width: columnWidths[colIndex],
          align: "center",
        });
      }
    });

    currentRowIndex++;
  };

  // Función para dibujar una fila de gran total por moneda
  const drawGranTotal = (
    totalSaldo: number,
    totalSaldoUSD: number,
    labelText: string
  ) => {
    const rowY =
      140 + rowMargin + currentRowIndex * (rowBackgroundHeight + rowMargin);

    // Dibujar fondo de la fila con color oscuro (como gran total)
    doc
      .rect(
        barMargin,
        rowY,
        doc.page.width - barMargin * 2,
        rowBackgroundHeight
      )
      .fill("#1d113e");

    // Texto del gran total en negrita y blanco
    doc
      .font("roboto-bold")
      .fontSize(10)
      .fillColor("white")
      .text(labelText, columnX[1] + 5, rowY + textVerticalOffset, {
        width: columnWidths[1] - 10,
        align: "left",
      });

    // Formatear totales
    const saldoFormateado = totalSaldo.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const saldoUSDFormateado = totalSaldoUSD.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Mostrar totales en las columnas correspondientes
    doc.text(saldoFormateado, columnX[5], rowY + textVerticalOffset, {
      width: columnWidths[5],
      align: "center",
    });

    doc.text(saldoUSDFormateado, columnX[6], rowY + textVerticalOffset, {
      width: columnWidths[6],
      align: "center",
    });

    doc.font("roboto-regular").fillColor("#000000"); // Restaurar fuente normal y color
    currentRowIndex++;
  };

  // Dibujar cada grupo de moneda
  const totalesPorMoneda: {
    [key: string]: { saldo: number; saldoUSD: number };
  } = {
    PEN: { saldo: 0, saldoUSD: 0 },
    USD: { saldo: 0, saldoUSD: 0 },
  };

  // Grupo USD
  if (posicionesPorMoneda.USD.length > 0) {
    drawGroupHeader("USD", "$ (USD)");

    posicionesPorMoneda.USD.forEach((posicion) => {
      drawDataRow(posicion, globalRowNumber);
      globalRowNumber++;
      totalesPorMoneda.USD.saldo += posicion.saldo;
      totalesPorMoneda.USD.saldoUSD += posicion.saldoUSD;
    });

    drawGranTotal(
      totalesPorMoneda.USD.saldo,
      totalesPorMoneda.USD.saldoUSD,
      "Gran total $"
    );
  }

  // Grupo PEN
  if (posicionesPorMoneda.PEN.length > 0) {
    drawGroupHeader("PEN", "S/. (PEN)");

    posicionesPorMoneda.PEN.forEach((posicion) => {
      drawDataRow(posicion, globalRowNumber);
      globalRowNumber++;
      totalesPorMoneda.PEN.saldo += posicion.saldo;
      totalesPorMoneda.PEN.saldoUSD += posicion.saldoUSD;
    });

    drawGranTotal(
      totalesPorMoneda.PEN.saldo,
      totalesPorMoneda.PEN.saldoUSD,
      "Gran total S/."
    );
  }
};

const cabeceraTablaTransacciones = (
  doc: any,
  barMargin: number,
  headers: {
    label: string;
    width: number;
  }[]
) => {
  const barHeight = 35; // Aumentado para que quepa el texto con saltos de línea

  // Fondo encabezado
  doc
    .rect(barMargin, 120, doc.page.width - barMargin * 2, barHeight)
    .fill("#1d113e");

  // Calcular posiciones dinámicas de las columnas para ocupar todo el ancho
  const tableWidth = doc.page.width - barMargin * 2;
  const columnWidths = headers.map((h) => h.width * tableWidth);

  // Calcular posiciones X de cada columna
  const columnX: number[] = [];
  let currentX = barMargin; // Sin padding inicial para usar todo el ancho
  for (let i = 0; i < columnWidths.length; i++) {
    columnX.push(currentX);
    currentX += columnWidths[i];
  }

  doc.font("roboto-bold").fontSize(9).fillColor("white");

  headers.forEach((h, i) => {
    // Calcular centrado vertical basado en el número de líneas
    const numLines = h.label.split("\n").length;
    const lineHeight = 10; // Altura aproximada por línea con fontSize 9
    const textHeight = numLines * lineHeight;
    const textYPosition = 120 + (barHeight - textHeight) / 2;

    // Todos los textos centrados horizontalmente
    doc.text(h.label, columnX[i], textYPosition, {
      width: columnWidths[i],
      align: "center",
      lineGap: 2,
    });
  });

  // Generar filas dinámicamente desde fondosData
  doc.font("roboto-regular").fontSize(10).fillColor("#000000");

  return { columnX, columnWidths };
};

const transaccionesDeLosUltimos3Meses = (
  doc: any,
  transacciones: TransaccionData[]
) => {
  const barMargin = 50;
  // Cada tabla debe estar en su propia página
  doc.addPage();

  // ✅ Marca de agua
  marcaDeAgua(doc);

  // Titulo de la seccion
  subTitulo(doc, "Transacciones de los últimos 3 meses");

  const { columnX, columnWidths } = cabeceraTablaTransacciones(doc, barMargin, [
    { label: "FECHA DE\nSOLICITUD", width: 0.12 },
    { label: "FECHA DE\nASIGNACIÓN", width: 0.13 },
    { label: "FONDO MUTUO", width: 0.2 },
    { label: "TIPO DE\nMOVIMIENTO", width: 0.12 },
    { label: "N° DE\nCUOTAS", width: 0.11 },
    { label: "VALOR\nCUOTA", width: 0.11 },
    { label: "MONEDA", width: 0.1 },
    { label: "MONTO", width: 0.11 },
  ]);

  // Renderizar filas de transacciones
  let currentY = 155; // Posición inicial después del header
  const rowHeight = 25;
  const fontSize = 9;

  doc.font("roboto-regular").fontSize(fontSize).fillColor("#000000");

  transacciones.forEach((transaccion, index) => {
    // Verificar si necesitamos una nueva página
    if (currentY + rowHeight > doc.page.height - 50) {
      doc.addPage();
      marcaDeAgua(doc);
      currentY = 50;
    }

    // Fondo alternado para las filas
    if (index % 2 === 0) {
      doc
        .rect(
          barMargin,
          currentY - 5,
          doc.page.width - barMargin * 2,
          rowHeight
        )
        .fill("#f5f5f5");
      doc.fillColor("#000000");
    }

    // Columna 0: Fecha de solicitud (centrado)
    doc.text(transaccion.fechaSolicitud, columnX[0], currentY, {
      width: columnWidths[0],
      align: "center",
    });

    // Columna 1: Fecha de asignación (centrado)
    doc.text(transaccion.fechaAsignacion, columnX[1], currentY, {
      width: columnWidths[1],
      align: "center",
    });

    // Columna 2: Fondo mutuo (izquierda)
    doc.text(transaccion.fondoMutuo, columnX[2] + 5, currentY, {
      width: columnWidths[2] - 10,
      align: "left",
    });

    // Columna 3: Tipo de movimiento (centrado)
    doc.text(transaccion.tipoMovimiento, columnX[3], currentY, {
      width: columnWidths[3],
      align: "center",
    });

    // Columna 4: N° de cuotas (centrado)
    doc.text(
      transaccion.numCuotas.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
      columnX[4],
      currentY,
      {
        width: columnWidths[4],
        align: "center",
      }
    );

    // Columna 5: Valor cuota (centrado)
    doc.text(
      transaccion.valorCuota.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
      columnX[5],
      currentY,
      {
        width: columnWidths[5],
        align: "center",
      }
    );

    // Columna 6: Moneda (centrado)
    doc.text(transaccion.moneda, columnX[6], currentY, {
      width: columnWidths[6],
      align: "center",
    });

    // Columna 7: Monto (derecha)
    doc.text(
      transaccion.monto.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      columnX[7],
      currentY,
      {
        width: columnWidths[7] - 5,
        align: "right",
      }
    );

    currentY += rowHeight;
  });
};

// Datos de ejemplo - Estructura real de la API
const fundsFromAPI: FundAPI[] = [
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "globalGrowth",
    availableBalance: {
      amount: 2902,
      currency: "USD",
      shares: 1451,
    },
    balance: {
      amount: 3000000000,
      currency: "USD",
      shares: 1500,
    },
    costBasis: 0.5,
    currency: "USD",
    returns: {
      realized: 0.0476,
      unRealized: 0.05734,
    },
    series: "SERIES_B",
    sharePrice: 2,
  },
  {
    id: "cash",
    balance: {
      amount: 0,
      currency: "USD",
    },
    currency: "USD",
  },
  {
    id: "cash",
    balance: {
      amount: 0,
      currency: "PEN",
    },
    currency: "PEN",
  },
];

// Transformar los datos de la API al formato de la tabla
const fondosDataEjemplo = transformFundsData(fundsFromAPI);

// Datos de ejemplo para posiciones del portafolio
const portfolioDataEjemplo: PortfolioData = {
  portfolioId: "4482f8f1-d4ba-47e6-a8c6-b3eff2f7a2d3",
  timestamp: 1748667600000,
  customerId: "37f9dcc2-0ca4-406e-a669-c8879dbab91a",
  formattedDate: "2025-05-31",
  lastUpdate: 1759559736802,
  portfolio: {
    balances: [
      {
        amount: 1361.73,
        currency: "USD",
      },
      {
        amount: 0,
        currency: "PEN",
      },
    ],
    funds: [
      {
        balance: {
          amount: 0,
          currency: "USD",
        },
        currency: "USD",
        id: "cash",
      },
      {
        balance: {
          amount: 0,
          currency: "PEN",
        },
        currency: "PEN",
        id: "cash",
      },
      {
        balance: {
          amount: 1361.73,
          currency: "USD",
          shares: 135.84014336,
        },
        costBasis: 1397.39,
        currency: "USD",
        id: "usa500USD",
        returns: {
          realized: -602.6032411,
          unRealized: -35.6667589,
        },
        series: "SERIES_B",
        sharePrice: 10.02447606,
      },
      {
        balance: {
          amount: 1361.73,
          currency: "USD",
          shares: 135.84014336,
        },
        costBasis: 1397.39,
        currency: "USD",
        id: "usa500USD",
        returns: {
          realized: -602.6032411,
          unRealized: -35.6667589,
        },
        series: "SERIES_B",
        sharePrice: 10.02447606,
      },
      {
        balance: {
          amount: 1361.73,
          currency: "USD",
          shares: 135.84014336,
        },
        costBasis: 1397.39,
        currency: "USD",
        id: "usa500USD",
        returns: {
          realized: -602.6032411,
          unRealized: -35.6667589,
        },
        series: "SERIES_B",
        sharePrice: 10.02447606,
      },
      {
        balance: {
          amount: 1361.73,
          currency: "PEN",
          shares: 135.84014336,
        },
        costBasis: 1397.39,
        currency: "PEN",
        id: "usa500USD",
        returns: {
          realized: -602.6032411,
          unRealized: -35.6667589,
        },
        series: "SERIES_B",
        sharePrice: 10.02447606,
      },
    ],
    id: "4482f8f1-d4ba-47e6-a8c6-b3eff2f7a2d3",
  },
};

// Transformar los datos del portafolio al formato de posiciones
const posicionesDataEjemplo = transformPortfolioData(portfolioDataEjemplo);
const posicionesDataEjemplo2 = transformPortfolioData(portfolioDataEjemplo);

// Datos de ejemplo para transacciones
const transaccionesFromAPI: TransaccionAPI[] = [
  {
    customerId: "95f76a7d-17a5-41a2-b42a-60bcbf46db79",
    id: "de351e3c-b095-4518-aae6-209856476ffa",
    amount: 100,
    comments: {
      confirmed: {
        at: 1750085825889,
        by: "sebastian",
        comment: "confirmado",
      },
    },
    confirmedBy: "sebastian",
    creationDate: 1741374018042,
    currency: "USD",
    fund: {
      id: "usa500USD",
      series: "SERIES_B",
    },
    lastUpdate: 1750085826749,
    origin: {
      bank: {
        id: "1",
        transaction: {
          id: "12121",
        },
      },
    },
    priceDate: 1748365946061,
    requestData: {
      amount: 100,
      creationDate: 1748279546061,
    },
    settlementDate: 1748279546061,
    status: "CONFIRMED",
    transactionDate: 1748279546061,
    type: "BUY",
    shares: 50.25,
    price: 1.99,
  },
  {
    customerId: "95f76a7d-17a5-41a2-b42a-60bcbf46db79",
    id: "abc123-456-789",
    amount: 500,
    creationDate: 1743374018042,
    currency: "PEN",
    fund: {
      id: "globalGrowth",
      series: "SERIES_A",
    },
    lastUpdate: 1750085826749,
    priceDate: 1748465946061,
    requestData: {
      amount: 500,
      creationDate: 1748379546061,
    },
    settlementDate: 1748379546061,
    status: "CONFIRMED",
    transactionDate: 1748379546061,
    type: "SELL",
    shares: 125.5,
    price: 3.98,
  },
  {
    customerId: "95f76a7d-17a5-41a2-b42a-60bcbf46db79",
    id: "de351e3c-b095-4518-aae6-209856476ffa",
    amount: 100,
    comments: {
      confirmed: {
        at: 1750085825889,
        by: "sebastian",
        comment: "confirmado",
      },
    },
    confirmedBy: "sebastian",
    creationDate: 1741374018042,
    currency: "USD",
    fund: {
      id: "usa500USD",
      series: "SERIES_B",
    },
    lastUpdate: 1750085826749,
    origin: {
      bank: {
        id: "1",
        transaction: {
          id: "12121",
        },
      },
    },
    priceDate: 1748365946061,
    requestData: {
      amount: 100,
      creationDate: 1748279546061,
    },
    settlementDate: 1748279546061,
    status: "CONFIRMED",
    transactionDate: 1748279546061,
    type: "BUY",
    shares: 50.25,
    price: 1.99,
  },
  {
    customerId: "95f76a7d-17a5-41a2-b42a-60bcbf46db79",
    id: "abc123-456-789",
    amount: 500,
    creationDate: 1743374018042,
    currency: "PEN",
    fund: {
      id: "globalGrowth",
      series: "SERIES_A",
    },
    lastUpdate: 1750085826749,
    priceDate: 1748465946061,
    requestData: {
      amount: 500,
      creationDate: 1748379546061,
    },
    settlementDate: 1748379546061,
    status: "CONFIRMED",
    transactionDate: 1748379546061,
    type: "SELL",
    shares: 125.5,
    price: 3.98,
  },
];

// Transformar las transacciones al formato de la tabla
const transaccionesDataEjemplo =
  transformTransaccionesData(transaccionesFromAPI);

// Stream
doc.pipe(fs.createWriteStream("documento.pdf"));

// ✅ Registrar fuentes personalizadas
doc.registerFont("roboto-bold", "fonts/Roboto-Bold.ttf");
doc.registerFont("roboto-regular", "fonts/Roboto-Regular.ttf");
doc.registerFont("roboto-medium", "fonts/Roboto-Medium.ttf");
doc.registerFont("roboto-light", "fonts/Roboto-Light.ttf");
doc.registerFont("roboto-thin", "fonts/Roboto-Thin.ttf");
doc.registerFont("roboto-medium", "fonts/Roboto-Medium.ttf");
doc.registerFont("roboto-medium", "fonts/Roboto-Medium.ttf");
portada(doc);
resumenPortafolio(doc, fondosDataEjemplo);
posicionesDelPortafolio(doc, posicionesDataEjemplo, posicionesDataEjemplo2);
transaccionesDeLosUltimos3Meses(doc, transaccionesDataEjemplo);

// Cerrar PDF
doc.end();

console.log("PDF creado exitosamente: documento.pdf");
