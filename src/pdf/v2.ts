import { Eecc } from "../domain/Eecc";
import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import { Customer } from "../domain/Customer";
import { Currency, Portfolio, PortfolioFund } from "../domain/Portfolio";
import { PortfolioHistory } from "../domain/PortfolioHistory";
import { findByIdAndDate } from "../repositories/fundHistory";
import { FundHistory } from "../domain/FundHistory";
import { ExchangeHistory } from "../domain/ExchangeHistory";

export function generatePdf(eecc: Eecc) {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 20,
  });

  // Stream
  doc.pipe(fs.createWriteStream("documento.pdf"));
  doc.registerFont("gilroy-regular", "fonts/Gilroy-Regular.ttf");
  doc.registerFont("gilroy-bold", "fonts/Gilroy-Bold.ttf");
  doc.registerFont("gilroy-light", "fonts/Gilroy-Light.ttf");
  doc.registerFont("gilroy-medium", "fonts/Gilroy-Medium.ttf");
  doc.registerFont("gilroy-regular", "fonts/Gilroy-Regular.ttf");
  doc.registerFont("gilroy-semibold", "fonts/Gilroy-SemiBold.ttf");
  doc.registerFont("gilroy-thin", "fonts/Gilroy-Thin.ttf");

  portada(doc, eecc.year, eecc.month);

  resumenPortafolio(doc, eecc);
  posicionesDelPortafolio(doc, eecc);
  transaccionesDeLosUltimos3Meses(doc, eecc);

  // Cerrar PDF
  doc.end();
}

const subTitulo = (doc: any, text: string) => {
  doc.font("gilroy-bold").fontSize(28).fillColor("#1d113e").text(text, 50, 60, {
    align: "left",
    width: doc.page.width,
  });
};

const marcaDeAgua = (doc: any, customer: Customer) => {
  doc.image("img/BlumLogo.png", 20, 15, {
    width: 40,
  });

  // Texto del usuario (DNI + nombre)
  const userText = `${
    customer.mainIdentityDocumentNumber
  } - ${customer.getNames()} ${customer.getLastNames()}`;

  // Fecha FIJA (cerca del borde derecho)
  const dateText = "1/Oct/2025 - 31/Oct/2025";
  const dateX = doc.page.width - 115; // Posición fija de la fecha (100px desde el borde derecho)

  // Espacio entre el nombre y la fecha
  const spacing = 20;

  // Configurar fuentes para medir correctamente
  doc.font("gilroy-regular").fontSize(8);
  const userTextWidth = doc.widthOfString(userText);

  // Calcular posición dinámica del nombre (hacia la izquierda de la fecha)
  const userTextX = dateX - userTextWidth - spacing;

  doc.fillColor("#000000").text(userText, userTextX, 20, {
    lineBreak: false,
    continued: false,
  });

  doc
    .font("gilroy-regular")
    .fontSize(8)
    .fillColor("#000000")
    .text(dateText, dateX, 20, {
      lineBreak: false,
    });
};

const portada = (doc: any, year: string, month: string) => {
  // ✅ Fondo que cubre toda la página
  doc.image("img/fondo.jpeg", 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });
  // ---- TÍTULO ----
  doc
    .font("gilroy-bold")
    .fontSize(48)
    .fillColor("white")
    .text("Estado de", 0, 280, {
      align: "center",
      width: doc.page.width,
    });

  doc
    .font("gilroy-bold")
    .fontSize(48)
    .fillColor("white")
    .text("cuenta", -34, 320, {
      align: "center",
      width: doc.page.width,
    });

  // ---- SUBTÍTULO ----
  doc
    .font("gilroy-bold")
    .fontSize(32)
    .fillColor("#40c06f") // verde similar al original
    .text(`${getMonthName(month)} ${year}`, 4, 390, {
      align: "center",
      width: doc.page.width,
    });
};

const resumenPortafolio = (doc: any, eecc: Eecc) => {
  // Agregar nueva página
  doc.addPage();
  // ✅ Marca de agua
  marcaDeAgua(doc, eecc.customer);

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

  eecc.portfolioHistoryOfMonth.portfolio.funds
    .filter((fondo) => fondo.id !== "cash")
    .forEach((fondo, rowIndex) => {
      // Posición Y de la fila (incluye margen antes de la primera fila)
      const rowY =
        140 + rowMargin + rowIndex * (rowBackgroundHeight + rowMargin);

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

      const row = [
        numeroFila,
        `${fondo.id} ${fondo.series}`,
        fondo.currency,
        fondo.balance.amount,
        fondo.costBasis,
        "tobeDefined",
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

  distribuciones(
    doc,
    doc.page.height - 205 - 30,
    eecc.portfolioHistoryOfMonth,
    eecc.exchangeHistory
  );
};

const posicionesDelPortafolio = (doc: any, eecc: Eecc) => {
  const barMargin = 50;
  const rowBackgroundHeight = 20; // Altura del fondo de la fila
  const rowMargin = 1.5; // Margen entre filas
  const fontSize = 10; // Tamaño de fuente
  const textVerticalOffset = (rowBackgroundHeight - fontSize) / 2 - 2; // Centrado vertical

  // Agrupar posiciones por moneda
  const posicionesPorMoneda: { [key: string]: PortfolioFund[] } = {
    PEN: [],
    USD: [],
  };

  eecc.portfolioHistoryOfMonth.portfolio.funds
    .filter((fondo) => fondo.id !== "cash")
    .forEach((fondo) => {
      if (fondo.balance.currency === "PEN") {
        posicionesPorMoneda.PEN.push(fondo);
      } else if (fondo.balance.currency === "USD") {
        posicionesPorMoneda.USD.push(fondo);
      }
    });

  // Cada tabla debe estar en su propia página
  doc.addPage();

  // ✅ Marca de agua
  marcaDeAgua(doc, eecc.customer);

  // Titulo de la seccion
  subTitulo(doc, "Posiciones del portafolio");

  const { columnX, columnWidths } = cabeceraTabla(doc, barMargin, [
    { label: "N°", width: 0.05 },
    { label: "FONDO", width: 0.26 },
    { label: "SALDO AL", width: 0.16 },
    { label: "N° DE CUOTAS", width: 0.16 },
    { label: "VALOR CUOTA", width: 0.16 },
    { label: "SALDO", width: 0.16 },
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
      .font("gilroy-bold")
      .fontSize(10)
      .fillColor("#000000")
      .text(label, columnX[1] + 5, rowY + textVerticalOffset, {
        width: columnWidths[1] - 10,
        align: "left",
      });

    doc.font("gilroy-regular"); // Restaurar fuente normal
    currentRowIndex++;
  };

  // Función para dibujar una fila de datos
  const drawDataRow = (fondo: PortfolioFund, rowNum: number) => {
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

    const row = [
      numeroFila,
      `${fondo.id} ${fondo.series}`,
      fondo.balance.amount,
      fondo.balance.shares,
      fondo.sharePrice,
      fondo.balance.amount,
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
  const drawGranTotal = (totalSaldo: number, labelText: string) => {
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
      .font("gilroy-bold")
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

    // Mostrar totales en las columnas correspondientes
    doc.text(saldoFormateado, columnX[5], rowY + textVerticalOffset, {
      width: columnWidths[5],
      align: "center",
    });

    doc.font("gilroy-regular").fillColor("#000000"); // Restaurar fuente normal y color
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
      totalesPorMoneda.USD.saldo += posicion.balance.amount;
      totalesPorMoneda.USD.saldoUSD += posicion.balance.amount;
    });

    drawGranTotal(totalesPorMoneda.USD.saldo, "Gran total $");
  }

  // Grupo PEN
  if (posicionesPorMoneda.PEN.length > 0) {
    drawGroupHeader("PEN", "S/. (PEN)");

    posicionesPorMoneda.PEN.forEach((posicion) => {
      drawDataRow(posicion, globalRowNumber);
      globalRowNumber++;
      totalesPorMoneda.PEN.saldo += posicion.balance.amount;
    });

    drawGranTotal(totalesPorMoneda.PEN.saldo, "Gran total S/.");
  }
};

const getMonthName = (month: string) => {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return monthNames[Number(month) - 1];
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

  doc.font("gilroy-bold").fontSize(10).fillColor("white");

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
  doc.font("gilroy-regular").fontSize(10).fillColor("#000000");

  return { columnX, columnWidths };
};

const distribuciones = (
  doc: any,
  distributionY: number,
  portfolioHistory: PortfolioHistory,
  exchangeHistory: ExchangeHistory
) => {
  const barMargin = 20;
  const barHeight = 30; // Misma altura que la barra del título
  const totalWidth = doc.page.width - barMargin * 2;
  const halfWidth = totalWidth / 2;

  doc
    .font("gilroy-bold")
    .fontSize(18)
    .fillColor("#1d113e")
    .text("Distribución por moneda", barMargin, distributionY + 9, {
      width: halfWidth,
      align: "center",
    });

  // DISTRIBUCIÓN POR FONDO

  doc
    .font("gilroy-bold")
    .fontSize(18)
    .fillColor("#1d113e")
    .text("Distribución por fondo", barMargin + halfWidth, distributionY + 9, {
      width: halfWidth,
      align: "center",
    });

  // Datos para los gráficos
  const coloresMoneda = ["#292243", "#7fc6b3"];

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
    portfolioHistory.getCurrencyPercentage(exchangeHistory),
    coloresMoneda
  );

  // Gráfico de distribución por fondo (derecha) - centrado
  drawPieChart(
    doc,
    rightChartCenterX - 30,
    chartY,
    chartRadius,
    portfolioHistory.getPercentageOfFunds(exchangeHistory),
    coloresFondo
  );
};

const drawPieChart = (
  doc: any,
  centerX: number,
  centerY: number,
  radius: number,
  data: { label: string; value: number }[],
  colors: string[]
) => {
  // Total de valores (si son ya porcentajes o valores raw da igual)
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Si total es 0 -> dibujar círculo gris y la leyenda
  if (total <= 0) {
    doc.circle(centerX, centerY, radius).fill("#efefef");
  } else {
    let currentAngle = -Math.PI / 2; // empieza arriba

    data.forEach((item, index) => {
      if (item.value <= 0) return; // saltar valores 0

      const sliceAngle = (item.value / total) * (Math.PI * 2);
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      // Coordenadas del punto de inicio y fin en la circunferencia
      const startX = centerX + Math.cos(startAngle) * radius;
      const startY = centerY + Math.sin(startAngle) * radius;
      const endX = centerX + Math.cos(endAngle) * radius;
      const endY = centerY + Math.sin(endAngle) * radius;

      const color = colors[index % colors.length];

      // Dibujar sector: ir al centro -> a punto inicio -> arco -> volver al centro -> fill
      doc.save();
      doc.moveTo(centerX, centerY);
      doc.lineTo(startX, startY);
      doc.arc(centerX, centerY, radius, startAngle, endAngle);
      doc.lineTo(centerX, centerY);
      doc.closePath();

      doc.fillColor(color).fill();
      doc.restore();

      currentAngle = endAngle;
    });
  }

  // --- Leyenda ---
  const legendX = centerX + radius + 20;
  const legendSpacing = 18;
  const legendY = centerY - (data.length * legendSpacing) / 2;

  data.forEach((item, index) => {
    const color = colors[index % colors.length];
    const percentage =
      total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";

    // Cuadrado de color
    doc.rect(legendX, legendY + index * legendSpacing, 10, 10).fill(color);

    // Texto de leyenda (asegurar color de texto)
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#000")
      .text(
        `${item.label}: ${percentage}%`,
        legendX + 15,
        legendY + index * legendSpacing,
        {
          lineBreak: false,
        }
      );
  });
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

  doc.font("gilroy-bold").fontSize(9).fillColor("white");

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
  doc.font("gilroy-regular").fontSize(10).fillColor("#000000");

  return { columnX, columnWidths };
};

const transaccionesDeLosUltimos3Meses = (doc: any, eecc: Eecc) => {
  const barMargin = 50;
  // Cada tabla debe estar en su propia página
  doc.addPage();

  // ✅ Marca de agua
  marcaDeAgua(doc, eecc.customer);

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

  doc.font("gilroy-regular").fontSize(fontSize).fillColor("#000000");

  eecc.transactions.forEach((transaccion, index) => {
    // Verificar si necesitamos una nueva página
    if (currentY + rowHeight > doc.page.height - 50) {
      doc.addPage();
      marcaDeAgua(doc, eecc.customer);
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
    doc.text(transaccion.creationDate, columnX[0], currentY, {
      width: columnWidths[0],
      align: "center",
    });

    // Columna 1: Fecha de asignación (centrado)
    doc.text(transaccion.priceDate, columnX[1], currentY, {
      width: columnWidths[1],
      align: "center",
    });

    // Columna 2: Fondo mutuo (izquierda)
    doc.text(transaccion.fund.id, columnX[2] + 5, currentY, {
      width: columnWidths[2] - 10,
      align: "left",
    });

    // Columna 3: Tipo de movimiento (centrado)
    doc.text(transaccion.type, columnX[3], currentY, {
      width: columnWidths[3],
      align: "center",
    });

    // Columna 4: N° de cuotas (centrado)
    doc.text(transaccion.shares, columnX[4], currentY, {
      width: columnWidths[4],
      align: "center",
    });

    // Columna 5: Valor cuota (centrado)
    doc.text(transaccion.price, columnX[5], currentY, {
      width: columnWidths[5],
      align: "center",
    });

    // Columna 6: Moneda (centrado)
    doc.text(transaccion.currency, columnX[6], currentY, {
      width: columnWidths[6],
      align: "center",
    });

    // Columna 7: Monto (derecha)
    doc.text(
      transaccion.amount.toLocaleString("es-PE", {
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
