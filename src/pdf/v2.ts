import { Eecc } from "../domain/Eecc";
import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import { Customer } from "../domain/Customer";
import { PortfolioFund } from "../domain/Portfolio";
import { PortfolioHistory } from "../domain/PortfolioHistory";

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
  doc.registerFont("gilroy-semibold", "fonts/Gilroy-SemiBold.ttf");
  doc.registerFont("gilroy-thin", "fonts/Gilroy-Thin.ttf");

  portada(doc, eecc.year, eecc.month);

  posicionesDelPortafolio(
    doc,
    eecc.portfolioHistoryOfMonth,
    eecc.customer,
    eecc.portfolioHistoryPastMonth
  );

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
  doc.image("img/fondo.png", 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  doc.image("img/BlumLogo.png", 20, 15, {
    width: 60,
    align: "left",
  });
  // ---- TÍTULO ----
  doc
    .font("gilroy-bold")
    .fontSize(52)
    .fillColor("white")
    .text("Estado de", 50, 350, {
      align: "center",
      width: doc.page.width,
    });

  doc
    .font("gilroy-bold")
    .fontSize(52)
    .fillColor("white")
    .text("cuenta", 14, 400, {
      align: "center",
      width: doc.page.width,
    });

  // ---- SUBTÍTULO ----
  doc
    .font("gilroy-bold")
    .fontSize(32)
    .fillColor("#42bf6f")
    .text(`${getMonthName(month)} ${year}`, 58, 470, {
      align: "center",
      width: doc.page.width,
    });
};

const posicionesDelPortafolio = (
  doc: any,
  portfolioHistory: PortfolioHistory,
  customer: Customer,
  pastPortfolioHistory?: PortfolioHistory
) => {
  const barMargin = 50;
  const rowBackgroundHeight = 20;
  const rowMargin = 1.5;
  const fontSize = 10;
  const textVerticalOffset = (rowBackgroundHeight - fontSize) / 2 - 2;

  // Variable para rastrear la posición Y actual en la página
  let currentPageY = 0;

  // Función auxiliar para dibujar una tabla de portafolio
  const dibujarTablaPortafolio = (
    portfolio: PortfolioHistory,
    titulo: string,
    forzarNuevaPagina: boolean
  ) => {
    // Agrupar posiciones por moneda
    const posicionesPorMoneda: { [key: string]: PortfolioFund[] } = {
      PEN: [],
      USD: [],
    };

    portfolio.portfolio.funds
      .filter((fondo) => fondo.id !== "cash")
      .forEach((fondo) => {
        if (fondo.balance.currency === "PEN") {
          posicionesPorMoneda.PEN.push(fondo);
        } else if (fondo.balance.currency === "USD") {
          posicionesPorMoneda.USD.push(fondo);
        }
      });

    // Calcular cuántas filas necesitaremos
    const gruposConDatos =
      (posicionesPorMoneda.USD.length > 0 ? 1 : 0) +
      (posicionesPorMoneda.PEN.length > 0 ? 1 : 0);

    const totalRows =
      posicionesPorMoneda.USD.length +
      posicionesPorMoneda.PEN.length +
      gruposConDatos * 2; // *2 para header de grupo + total por cada grupo

    // Calcular espacio necesario para esta tabla
    const espacioNecesario =
      100 + // Espacio para título
      30 + // Header de tabla
      totalRows * (rowBackgroundHeight + rowMargin) +
      50; // Margen adicional

    const espacioDisponible = doc.page.height - currentPageY - 50;

    // Decidir si crear nueva página
    const necesitaNuevaPagina =
      forzarNuevaPagina || espacioDisponible < espacioNecesario;

    // Posición Y base para esta tabla
    let baseY = 60; // Posición estándar después del título

    if (necesitaNuevaPagina) {
      doc.addPage();
      marcaDeAgua(doc, customer);
      currentPageY = 0;
      baseY = 60;
    } else {
      // Si no hay nueva página, usar la posición actual con margen adicional
      baseY = currentPageY + 40; // +40 para dar espacio entre tablas
    }

    // Titulo de la sección con el título específico
    // El subTitulo dibuja en posición Y=60, necesitamos ajustar si no es nueva página
    if (necesitaNuevaPagina) {
      subTitulo(doc, titulo);
    } else {
      // Dibujar título en la posición actual
      doc
        .font("gilroy-bold")
        .fontSize(28)
        .fillColor("#1d113e")
        .text(titulo, 50, baseY, {
          align: "left",
          width: doc.page.width,
        });
      baseY += 50; // Espacio después del título
    }

    // Posición del header de la tabla
    const headerY = necesitaNuevaPagina ? 120 : baseY;

    // Dibujar header de tabla manualmente con Y personalizado
    doc
      .rect(barMargin, headerY, doc.page.width - barMargin * 2, 30)
      .fill("#1d113e");

    const headers = [
      { label: "N°", width: 0.05 },
      { label: "FONDO", width: 0.26 },
      { label: "SALDO AL", width: 0.16 },
      { label: "N° DE CUOTAS", width: 0.16 },
      { label: "VALOR CUOTA", width: 0.16 },
      { label: "BALANCE", width: 0.16 },
    ];

    const tableWidth = doc.page.width - barMargin * 2;
    const columnWidths = headers.map((h) => h.width * tableWidth);
    const columnX: number[] = [];
    let currentX = barMargin;
    for (let i = 0; i < columnWidths.length; i++) {
      columnX.push(currentX);
      currentX += columnWidths[i];
    }

    doc.font("gilroy-bold").fontSize(9).fillColor("white");
    headers.forEach((h, i) => {
      const numLines = h.label.split("\n").length;
      const lineHeight = 10;
      const textHeight = numLines * lineHeight;
      const textYPosition = headerY + (30 - textHeight) / 2;

      doc.text(h.label, columnX[i], textYPosition, {
        width: columnWidths[i],
        align: "center",
        lineGap: 2,
      });
    });
    doc.font("gilroy-regular").fontSize(10).fillColor("#000000");

    // Posición inicial de las filas (después del header)
    const startRowY = headerY + 30;
    let currentRowIndex = 0;
    let globalRowNumber = 1;

    // Función para verificar si necesitamos una nueva página
    const verificarNuevaPagina = () => {
      const rowY =
        startRowY +
        rowMargin +
        currentRowIndex * (rowBackgroundHeight + rowMargin);
      const maxY = doc.page.height - 50; // Margen inferior

      if (rowY + rowBackgroundHeight > maxY) {
        doc.addPage();
        marcaDeAgua(doc, customer);
        subTitulo(doc, titulo + " (continuación)");

        // Re-dibujar encabezado de tabla en posición estándar
        cabeceraTablaTransacciones(doc, barMargin, 30, [
          { label: "N°", width: 0.05 },
          { label: "FONDO", width: 0.26 },
          { label: "SALDO AL", width: 0.16 },
          { label: "N° DE CUOTAS", width: 0.16 },
          { label: "VALOR CUOTA", width: 0.16 },
          { label: "BALANCE", width: 0.16 },
        ]);

        currentRowIndex = 0;
        currentPageY = 0; // Resetear posición Y en la nueva página
      }
    };

    // Función para dibujar una fila de encabezado de grupo
    const drawGroupHeader = (label: string) => {
      verificarNuevaPagina();

      const rowY =
        startRowY +
        rowMargin +
        currentRowIndex * (rowBackgroundHeight + rowMargin);

      doc
        .rect(
          barMargin,
          rowY,
          doc.page.width - barMargin * 2,
          rowBackgroundHeight
        )
        .fill("#d0d0d0");

      doc
        .font("gilroy-bold")
        .fontSize(10)
        .fillColor("#000000")
        .text(label, columnX[1] + 5, rowY + textVerticalOffset + 2, {
          width: columnWidths[1] - 10,
          align: "left",
        });

      doc.font("gilroy-regular");
      currentRowIndex++;
    };

    // Función para dibujar una fila de datos
    const drawDataRow = (fondo: PortfolioFund, rowNum: number) => {
      verificarNuevaPagina();

      const rowY =
        startRowY +
        rowMargin +
        currentRowIndex * (rowBackgroundHeight + rowMargin);

      doc
        .rect(
          barMargin,
          rowY,
          doc.page.width - barMargin * 2,
          rowBackgroundHeight
        )
        .fill("#efefef");

      doc.fillColor("#000000");

      const numeroFila = rowNum.toString();

      const row = [
        numeroFila,
        `${fondo.id} ${fondo.series}`,
        fondo.balance.amount,
        fondo.balance.shares,
        fondo.sharePrice,
        fondo.balance.amount,
      ];

      const textY = rowY + textVerticalOffset + 2;

      row.forEach((value, colIndex) => {
        if (colIndex === 1) {
          doc.text(value, columnX[colIndex] + 5, textY, {
            width: columnWidths[colIndex] - 10,
            align: "left",
          });
        } else {
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
      verificarNuevaPagina();

      const rowY =
        startRowY +
        rowMargin +
        currentRowIndex * (rowBackgroundHeight + rowMargin);

      doc
        .rect(
          barMargin,
          rowY,
          doc.page.width - barMargin * 2,
          rowBackgroundHeight
        )
        .fill("#ffffff");

      doc
        .font("gilroy-bold")
        .fontSize(10)
        .fillColor("#000000")
        .text(labelText, columnX[1] + 5, rowY + textVerticalOffset, {
          width: columnWidths[1] - 10,
          align: "left",
        });

      const saldoFormateado = totalSaldo.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      doc.text(saldoFormateado, columnX[5], rowY + textVerticalOffset, {
        width: columnWidths[5],
        align: "center",
      });

      doc.font("gilroy-regular").fillColor("#000000");
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
      drawGroupHeader("$ (USD)");

      posicionesPorMoneda.USD.forEach((posicion) => {
        drawDataRow(posicion, globalRowNumber);
        globalRowNumber++;
        totalesPorMoneda.USD.saldo += posicion.balance.amount;
        totalesPorMoneda.USD.saldoUSD += posicion.balance.amount;
      });

      drawGranTotal(totalesPorMoneda.USD.saldo, "Total $");
    }

    // Grupo PEN
    if (posicionesPorMoneda.PEN.length > 0) {
      drawGroupHeader("S/. (PEN)");

      posicionesPorMoneda.PEN.forEach((posicion) => {
        drawDataRow(posicion, globalRowNumber);
        globalRowNumber++;
        totalesPorMoneda.PEN.saldo += posicion.balance.amount;
      });

      drawGranTotal(totalesPorMoneda.PEN.saldo, "Total S/.");
    }

    // Actualizar la posición Y actual después de dibujar la tabla
    const filasFinal = currentRowIndex;
    currentPageY =
      startRowY +
      rowMargin +
      filasFinal * (rowBackgroundHeight + rowMargin) +
      30;
  };

  // Dibujar tabla del mes actual (siempre forzar nueva página para la primera)
  dibujarTablaPortafolio(portfolioHistory, "Posiciones del portafolio", true);

  // Dibujar tabla del mes pasado si existe (NO forzar nueva página, solo si no cabe)
  if (pastPortfolioHistory) {
    dibujarTablaPortafolio(
      pastPortfolioHistory,
      "Posiciones del portafolio - Mes anterior",
      false
    );
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

const cabeceraTablaTransacciones = (
  doc: any,
  barMargin: number,
  barHeight: number,
  headers: {
    label: string;
    width: number;
  }[]
) => {
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
    const numLines = h.label.split("\n").length;
    const lineHeight = 10;
    const textHeight = numLines * lineHeight;
    const textYPosition = 120 + (barHeight - textHeight) / 2;

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
