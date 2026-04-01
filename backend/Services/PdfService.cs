using backend.DTOs;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace backend.Services;

public interface IPdfService
{
    byte[] GenerateExpenseReport(List<ExpenseDto> expenses, string userName, DateTime? start, DateTime? end);
}

public class PdfService : IPdfService
{
    public byte[] GenerateExpenseReport(List<ExpenseDto> expenses, string userName, DateTime? start, DateTime? end)
    {
        using var ms = new MemoryStream();
        var document = new Document(PageSize.A4, 40f, 40f, 60f, 40f);
        var writer = PdfWriter.GetInstance(document, ms);

        document.Open();

        // Colors
        var primaryColor = new BaseColor(99, 102, 241);   // indigo
        var darkColor = new BaseColor(17, 24, 39);
        var grayColor = new BaseColor(107, 114, 128);
        var lightGray = new BaseColor(243, 244, 246);

        // Fonts
        var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 22, primaryColor);
        var subtitleFont = FontFactory.GetFont(FontFactory.HELVETICA, 11, grayColor);
        var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
        var cellFont = FontFactory.GetFont(FontFactory.HELVETICA, 9, darkColor);
        var boldCellFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, darkColor);
        var summaryTitleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, darkColor);
        var summaryValueFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 16, primaryColor);

        // Header
        var header = new Paragraph("Smart Expense Tracker", titleFont) { Alignment = Element.ALIGN_LEFT };
        document.Add(header);

        var subText = $"Expense Report for {userName}";
        if (start.HasValue || end.HasValue)
        {
            subText += $" | {start?.ToString("MMM dd, yyyy") ?? "All time"} - {end?.ToString("MMM dd, yyyy") ?? "Present"}";
        }
        document.Add(new Paragraph(subText, subtitleFont));
        document.Add(new Paragraph($"Generated: {DateTime.Now:MMM dd, yyyy HH:mm}", subtitleFont));
        document.Add(new Chunk("\n"));

        // Summary boxes
        var total = expenses.Sum(e => e.Amount);
        var categoryGroups = expenses.GroupBy(e => e.Category)
            .Select(g => new { Category = g.Key, Amount = g.Sum(e => e.Amount), Count = g.Count() })
            .OrderByDescending(g => g.Amount).ToList();

        var summaryTable = new PdfPTable(3) { WidthPercentage = 100 };
        summaryTable.SetWidths(new float[] { 1, 1, 1 });

        void AddSummaryCell(string label, string value)
        {
            var cell = new PdfPCell
            {
                BackgroundColor = lightGray,
                BorderColor = new BaseColor(229, 231, 235),
                Padding = 12f,
                BorderWidth = 1f
            };
            cell.AddElement(new Paragraph(label, subtitleFont));
            cell.AddElement(new Paragraph(value, summaryValueFont));
            summaryTable.AddCell(cell);
        }

        AddSummaryCell("Total Expenses", $"₹{total:N2}");
        AddSummaryCell("Number of Transactions", expenses.Count.ToString());
        AddSummaryCell("Categories", categoryGroups.Count.ToString());
        document.Add(summaryTable);
        document.Add(new Chunk("\n"));

        // Category breakdown
        if (categoryGroups.Any())
        {
            document.Add(new Paragraph("Category Breakdown", summaryTitleFont));
            document.Add(new Chunk("\n"));

            var catTable = new PdfPTable(3) { WidthPercentage = 100 };
            catTable.SetWidths(new float[] { 2, 1, 1 });

            foreach (var col in new[] { "Category", "Amount", "Transactions" })
            {
                var cell = new PdfPCell(new Phrase(col, headerFont))
                {
                    BackgroundColor = primaryColor,
                    Padding = 8f,
                    BorderWidth = 0f
                };
                catTable.AddCell(cell);
            }

            foreach (var g in categoryGroups)
            {
                catTable.AddCell(new PdfPCell(new Phrase(g.Category, cellFont)) { Padding = 7f, BorderColor = new BaseColor(229, 231, 235) });
                catTable.AddCell(new PdfPCell(new Phrase($"₹{g.Amount:N2}", boldCellFont)) { Padding = 7f, BorderColor = new BaseColor(229, 231, 235) });
                catTable.AddCell(new PdfPCell(new Phrase(g.Count.ToString(), cellFont)) { Padding = 7f, BorderColor = new BaseColor(229, 231, 235) });
            }

            document.Add(catTable);
            document.Add(new Chunk("\n"));
        }

        // Expense table
        document.Add(new Paragraph("All Transactions", summaryTitleFont));
        document.Add(new Chunk("\n"));

        var table = new PdfPTable(5) { WidthPercentage = 100 };
        table.SetWidths(new float[] { 2.5f, 1.5f, 1.2f, 1f, 2f });

        foreach (var col in new[] { "Title", "Amount", "Category", "Date", "Notes" })
        {
            var cell = new PdfPCell(new Phrase(col, headerFont))
            {
                BackgroundColor = primaryColor,
                Padding = 8f,
                BorderWidth = 0f
            };
            table.AddCell(cell);
        }

        bool alternate = false;
        foreach (var e in expenses)
        {
            var bg = alternate ? lightGray : BaseColor.WHITE;
            var borderColor = new BaseColor(229, 231, 235);

            table.AddCell(new PdfPCell(new Phrase(e.Title, cellFont)) { BackgroundColor = bg, Padding = 6f, BorderColor = borderColor });
            table.AddCell(new PdfPCell(new Phrase($"₹{e.Amount:N2}", boldCellFont)) { BackgroundColor = bg, Padding = 6f, BorderColor = borderColor });
            table.AddCell(new PdfPCell(new Phrase(e.Category, cellFont)) { BackgroundColor = bg, Padding = 6f, BorderColor = borderColor });
            table.AddCell(new PdfPCell(new Phrase(e.Date.ToString("dd MMM yy"), cellFont)) { BackgroundColor = bg, Padding = 6f, BorderColor = borderColor });
            table.AddCell(new PdfPCell(new Phrase(e.Notes ?? "-", cellFont)) { BackgroundColor = bg, Padding = 6f, BorderColor = borderColor });

            alternate = !alternate;
        }

        document.Add(table);
        document.Close();

        return ms.ToArray();
    }
}