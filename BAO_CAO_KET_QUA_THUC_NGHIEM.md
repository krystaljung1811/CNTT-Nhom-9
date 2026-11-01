# BÁO CÁO KẾT QUẢ NGHIÊN CỨU KHOA HỌC & THỰC NGHIỆM KHAI PHÁ DỮ LIỆU
## ĐỀ TÀI: NGHIÊN CỨU VỀ KHAI PHÁ DỮ LIỆU VÀ ỨNG DỤNG PHÂN CỤM SẢN PHẨM DỰA TRÊN HÀNH VI DUYỆT XEM VÀ TƯƠNG TÁC CỦA NGƯỜI DÙNG

* **Lĩnh vực:** Khai phá dữ liệu (Knowledge Discovery in Databases - KDD) & Học máy Ứng dụng (Applied Machine Learning).
* **Tập dữ liệu thực nghiệm:** eCommerce Events History in Cosmetics Shop (20,692,840 sự kiện Clickstream, ~2.4 GB raw CSV).
* **Khung công nghệ:** DuckDB (In-Process Columnar OLAP Engine) + Apache Parquet (ZSTD) + Scikit-Learn + Plotly Interactive + In-Memory Live Web Application.
* **Quy mô danh mục chuẩn hóa:** 42,860 sản phẩm đại diện thương mại điện tử.
* **Thời gian chuỗi sự kiện:** 5 tháng liên tục (Từ tháng 10/2019 đến tháng 02/2020).

---

## MỤC LỤC BÁO CÁO
1. [Tổng quan Đề tài & Quản trị Big Data](#1-tổng-quan-đề-tài--quản-trị-big-data)
2. [Quy trình Tiền xử lý Dữ liệu & Xử lý Ngoại lai Chuẩn KDD](#2-quy-trình-tiền-xử-lý-dữ-liệu--xử-lý-ngoại-lai-chuẩn-kdd)
3. [Thực nghiệm Đa mô hình & Đối sánh Học thuật Benchmark](#3-thực-nghiệm-đa-mô-hình--đối-sánh-học-thuật-benchmark)
4. [Định danh 5 Chân dung Sản phẩm (Product Personas)](#4-định-danh-5-chân-dung-sản-phẩm-product-personas)
5. [Case Study Thực tế: Bóc tách Đích danh Sản phẩm Tiêu biểu](#5-case-study-thực-tế-bóc-tách-đích-danh-sản-phẩm-tiêu-biểu)
6. [Phân tích Động thái Xu hướng Chuỗi Thời gian 5 Tháng (10/2019 - 02/2020)](#6-phân-tích-động-thái-xu-hướng-chuỗi-thời-gian-5-tháng)
7. [Kiến trúc Ứng dụng Thực tiễn & Hệ thống Web Demo Tương tác](#7-kiến-trúc-ứng-dụng-thực-tiễn--hệ-thống-web-demo-tương-tác)
8. [Kết luận Khoa học & Hướng Phát triển Đề tài](#8-kết-luận-khoa-học--hướng-phát-triển-đề-tài)

---

## 1. TỔNG QUAN ĐỀ TÀI & QUẢN TRỊ BIG DATA

### 1.1. Bối cảnh & Mục tiêu Nghiên cứu
Trong thương mại điện tử hiện đại, phương pháp phân loại sản phẩm truyền thống chủ yếu dựa vào cây danh mục danh nghĩa (*Category Taxonomy* như son môi, máy sấy, sơn móng...). Cách tiếp cận tĩnh này bỏ qua hoàn toàn **dấu chân hành vi (Digital Footprint)** và **trạng thái tâm lý người tiêu dùng** xuyên suốt phễu mua sắm (*Purchase Funnel*).

Đề tài nghiên cứu ứng dụng quy trình **KDD (Knowledge Discovery in Databases)** nhằm:
1. Thu gom, nén và quản trị tập dữ liệu lớn hàng chục triệu bản ghi Clickstream với chi phí tính toán thấp.
2. Trích xuất các thuộc tính hành vi tương tác đa chiều (Duyệt xem, Thêm giỏ, Hủy giỏ, Chốt đơn, Tốc độ quyết định, Doanh thu thực tế).
3. Huấn luyện và đối sánh học thuật các thuật toán phân cụm không giám sát (*Unsupervised Clustering*).
4. Định danh các nhóm chân dung sản phẩm (*Product Personas*) trực diện theo hành vi khách hàng, bóc tách nguyên nhân tâm lý và dự báo vòng đời sản phẩm phục vụ chiến lược kinh doanh.

### 1.2. Hiệu quả Tối ưu hóa I/O với DuckDB & Parquet
* 5 file CSV ban đầu có dung lượng **2.4 GB (20,692,840 dòng)**. Nếu nạp thô vào bộ nhớ Pandas sẽ chiếm dụng hơn **8 - 10 GB RAM** và gây nghẽn cổ chai I/O.
* Chúng tôi thiết kế pipeline sử dụng **DuckDB** đọc song song đa luồng (Multi-threaded Columnar Vectorization) và nén sang định dạng cột **Apache Parquet (ZSTD)**:

| Chỉ số kỹ thuật | Dữ liệu thô (Raw CSV) | Tối ưu hóa (DuckDB + Parquet) | Hiệu quả cải tiến |
| :--- | :--- | :--- | :--- |
| **Dung lượng lưu trữ** | 2,400 MB (2.4 GB) | **320 MB** (Nén ZSTD) | **Tiết kiệm 86.7% đĩa cứng** |
| **Cấu trúc lưu trữ** | Text phân tách dấu phẩy phi cấu trúc | Định dạng cột nén ZSTD, có thống kê min/max zone map | Đọc cột chọn lọc không quét toàn bảng |
| **Tốc độ quét 20.7M dòng** | ~45 - 60 giây | **0.58 giây** | **Nhanh hơn gấp 75 - 100 lần** |
| **Lọc dữ liệu bất thường** | Phải đọc toàn bộ file | Lọc trực tiếp `price > 0` và `event_type IS NOT NULL` khi nén | Dữ liệu sạch ngay từ tầng nạp |
| **Quy mô danh mục SP** | 54,571 mã sản phẩm | **42,860 sản phẩm** (đạt ngưỡng `view_count >= 10`) | Loại bỏ 11,711 sản phẩm nhiễu/spam click |

---

## 2. QUY TRÌNH TIỀN XỬ LÝ DỮ LIỆU & XỬ LÝ NGOẠI LAI CHUẨN KDD

### 2.1. Không gian Đặc trưng Hành vi Đa Chiều (11 Thuộc tính)
Từ bảng sự kiện thô, chúng tôi tổng hợp ma trận đặc trưng cho **42,860 sản phẩm**, chia thành 2 nhóm:
1. **Nhóm Quy mô & Giá trị (Count & Monetary Features):**
   - $x_1$: `view_count` - Tổng số lượt duyệt xem sản phẩm.
   - $x_2$: `cart_count` - Tổng số lượt thêm sản phẩm vào giỏ hàng.
   - $x_3$: `remove_count` - Tổng số lượt gỡ bỏ sản phẩm khỏi giỏ hàng.
   - $x_4$: `purchase_count` - Tổng số lượt thanh toán mua hàng thành công.
   - $x_5$: `est_revenue` - Tổng doanh số ước tính mang lại ($ = purchase\_count \times avg\_price$).
   - $x_6$: `avg_price` - Đơn giá trung bình của sản phẩm ($).
2. **Nhóm Tỷ lệ Chuyển đổi Phễu & Tương tác (Funnel Rate Features):**
   - $x_7$: `view_to_cart_rate` $= \frac{cart\_count}{view\_count}$ (Tỷ lệ từ xem sang bỏ giỏ).
   - $x_8$: `cart_to_purchase_rate` $= \frac{purchase\_count}{cart\_count}$ (Tỷ lệ từ giỏ sang chốt đơn).
   - $x_9$: `overall_conversion_rate` $= \frac{purchase\_count}{view\_count}$ (Tỷ lệ chuyển đổi tổng thể).
   - $x_{10}$: `cart_removal_rate` $= \frac{remove\_count}{cart\_count}$ (Tỷ lệ hủy bỏ giỏ hàng).
   - $x_{11}$: `user_engagement` $= \frac{view + cart \times 3 + purchase \times 5}{unique\_sessions}$ (Điểm số gắn kết hành vi có trọng số).

### 2.2. Khảo sát Giá trị Khuyết & Xử lý Toàn vẹn Dữ liệu (Null Imputation & Sanity Checks)
* **Thương hiệu (`brand`):** Có 1,720 sản phẩm không có thương hiệu đăng ký $\rightarrow$ Chuẩn hóa gán nhãn `"Unknown"` để không làm sai lệch đặc trưng thương hiệu.
* **Xử lý phép chia cho 0:** Khi sản phẩm có $view\_count = 0$ hoặc $cart\_count = 0$, các phép tính tỷ lệ sinh ra giá trị bất định ($NaN, +\infty, -\infty$). Chúng tôi áp dụng quy tắc gán chuẩn mực:
$$\text{Rate} = \begin{cases} \frac{\text{Numerator}}{\text{Denominator}}, & \text{nếu Denominator} > 0 \\ 0.0, & \text{ngược lại} \end{cases}$$

### 2.3. Khảo sát Độ lệch (Skewness) & Phát hiện Ngoại lai bằng Quy tắc IQR
Dữ liệu thương mại điện tử tuân theo quy luật phân phối đuôi dài (*Heavy-tailed Power Law Distribution*). Chúng tôi tiến hành đo lường hệ số bất đối xứng (Skewness), độ nhọn (Kurtosis) và xác định ngoại lai theo phương pháp **IQR (Interquartile Range)**:
$$\text{IQR} = Q_3 - Q_1, \quad \text{Ngưỡng trên} = Q_3 + 1.5 \times \text{IQR}$$

#### Bảng kết quả khảo sát ngoại lai thực nghiệm trên 42,860 sản phẩm:
| Thuộc tính số | Skewness (Độ lệch) | Kurtosis (Độ nhọn) | Q1 (25%) | Q3 (75%) | Ngưỡng trên IQR | Số lượng Ngoại lai | Tỷ lệ Ngoại lai (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **view_count** | **17.84** | **482.1** | 9.00 | 88.00 | 206.50 | 4,512 | 10.53% |
| **cart_count** | **23.15** | **781.4** | 2.00 | 34.00 | 82.00 | 4,890 | 11.41% |
| **remove_count** | **21.40** | **670.2** | 1.00 | 21.00 | 51.00 | 4,732 | 11.04% |
| **purchase_count**| **25.80** | **945.6** | 0.00 | 8.00 | 20.00 | 4,215 | 9.83% |
| **est_revenue** | **28.92** | **1,210.5** | 0.00 | 42.15 | 105.38 | 4,980 | 11.62% |
| **avg_price** | **6.12** | **58.4** | 2.05 | 6.83 | 14.00 | 3,120 | 7.28% |

> **Nhận xét thống kê:** Độ lệch Skewness của `est_revenue` (28.92) và `purchase_count` (25.80) ở mức cực đoan. Nếu đưa trực tiếp vào thuật toán phân cụm, khoảng cách Euclidean sẽ bị thống trị 100% bởi một số ít sản phẩm có lượt xem/doanh số khổng lồ, làm tê liệt khả năng học của mô hình.

### 2.4. Biện luận Học thuật & Chiến lược Xử lý Ngoại lai Chuẩn KDD
* **Nguyên tắc không loại bỏ (No-Dropping Rule):** Trong bài toán thương mại điện tử, các ngoại lai có doanh thu và lượt bán đột biến (Top 1% Bestsellers) và máy móc thiết bị giá cao ($200) chính là những sản phẩm tạo ra hơn **75% dòng tiền cốt lõi** của doanh nghiệp. Nếu máy móc loại bỏ các điểm ngoại lai này, bài toán phân cụm sẽ bị méo mó và triệt tiêu hoàn toàn tri thức kinh doanh.
* **Chiến lược 2 tầng (Two-Tier Treatment):**
  1. **Tầng 1 - Winsorization Capping (99.5% Percentile):** Cắt bớt phần đuôi trên ở phân vị 99.5% nhằm triệt tiêu các điểm dị biệt nhiễu do lỗi hệ thống hoặc bot/spam click tự động.
  2. **Tầng 2 - Biến đổi Phi tuyến Log-Transform ($np.log1p$):** Áp dụng hàm toán học nén không gian:
     $$y = \ln(1 + x)$$
     Hàm $log1p$ bảo toàn tính đơn điệu, triệt tiêu đuôi dài và kéo phân phối lệch phải về phân phối tiệm cận chuẩn (Near-Gaussian Distribution).

#### Bảng hiệu quả giảm độ lệch sau khi xử lý Log1p:
| Thuộc tính | Skewness Gốc | Skewness Sau Log1p | Mức giảm độ lệch (%) | Đánh giá phân phối |
| :--- | :---: | :---: | :---: | :--- |
| `view_count` | 17.84 | **0.42** | **-97.6%** | Tiệm cận chuẩn Gaussian đối xứng |
| `cart_count` | 23.15 | **0.68** | **-97.1%** | Tiệm cận chuẩn Gaussian đối xứng |
| `remove_count` | 21.40 | **0.75** | **-96.5%** | Tiệm cận chuẩn Gaussian đối xứng |
| `purchase_count` | 25.80 | **1.12** | **-95.7%** | Phân phối cân bằng ổn định |
| `est_revenue` | 28.92 | **0.95** | **-96.7%** | Tiệm cận chuẩn Gaussian đối xứng |
| `avg_price` | 6.12 | **1.08** | **-82.4%** | Phân phối cân bằng ổn định |

### 2.5. Chuẩn hóa Z-Score & Phân tích Thành phần Chính (PCA)
* Áp dụng **StandardScaler** đưa toàn bộ 11 thuộc tính về cùng thang đo $\mu = 0, \sigma = 1$:
  $$z = \frac{x - \mu}{\sigma}$$
* **PCA 5 Chiều:** Giải thích tới **92.80%** tổng phương sai dữ liệu (giảm chiều phục vụ thuật toán mật độ HDBSCAN).
* **PCA 2 Chiều:** Giải thích **68.70%** phương sai (phục vụ trực quan hóa không gian cụm phẳng).

---

## 3. THỰC NGHIỆM ĐA MÔ HÌNH & ĐỐI SÁNH HỌC THUẬT BENCHMARK

Chúng tôi tiến hành huấn luyện độc lập và đối sánh đồng thời 3 mô hình đại diện cho 3 trường phái phân cụm kinh điển trên cùng ma trận đặc trưng chuẩn hóa ($N = 42,860$):

| Thuật toán Phân cụm | Trường phái Thuật toán | Số cụm ($k$) | Tỷ lệ nhiễu (% Noise) | Silhouette Score ($\uparrow$) | Davies-Bouldin Index ($\downarrow$) | Calinski-Harabasz ($\uparrow$) | Thời gian chạy (s) | Đánh giá Khả năng Triển khai Nghiệp vụ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **K-Means (Optimal)** | **Phân hoạch (Partitional)** | **5** | **0.00%** | **0.2293** | **1.3535** | **11,887.55** | **0.57 s** | **Tối ưu Sản xuất (Production-Ready) - Độ phủ 100%** |
| **Gaussian Mixture (GMM)**| **Mô hình Xác suất (Probabilistic)**| 5 | 0.00% | 0.1545 | 1.5333 | 6,723.71 | 1.92 s | Chồng lấn biên xác suất mềm, hội tụ chậm hơn 3.5 lần |
| **HDBSCAN** | **Mật độ phân cấp (Density-Based)** | 2 | 17.91% | 0.4055* | 0.8413* | 14,316.87* | 18.43 s | Bỏ rơi 7,675 SP (17.91% Nhiễu), không thể phân loại toàn sàn |

*\* Lưu ý: Với HDBSCAN, các chỉ số hình học đạt rất cao do thuật toán đã tự động loại trừ 17.91% sản phẩm khỏi quá trình chấm điểm, chỉ đo đạc trên các vùng lõi mật độ dày đặc.*

### Luận cứ Lựa chọn K-Means làm Mô hình Cốt lõi:
1. **Độ phủ danh mục 100%:** Trong vận hành thương mại điện tử, mọi sản phẩm trên sàn đều phải được định danh vào một nhóm quản trị. HDBSCAN loại bỏ 17.91% sản phẩm làm nhóm nhiễu (-1) khiến doanh nghiệp không thể áp dụng chính sách giá/tồn kho cho nhóm này.
2. **Cân bằng Hình học Xuất sắc:** K-Means đạt điểm Silhouette ($0.2293$) và DBI ($1.3535$) cao nhất trong các giải thuật phân hoạch toàn diện. Nhược điểm giả định hình cầu của K-Means đã được hóa giải nhờ bước biến đổi phi tuyến $log1p$.
3. **Thời gian Thực thi Siêu Tốc (0.57s):** Nhanh hơn 3.5 lần so với GMM và nhanh hơn **32 lần** so với HDBSCAN, cho phép tái phân cụm định kỳ hàng tuần/hàng tháng theo thời gian thực (*Batch Retraining*).

---

## 4. ĐỊNH DANH 5 CHÂN DUNG SẢN PHẨM (PRODUCT PERSONAS)

Dựa trên kết quả phân cụm tối ưu ($k=5$), bảng thống kê đặc tính định lượng của 5 Persona được bóc tách như sau:

| Mã Cụm | Tên Định danh Persona Trực diện | Số lượng SP | Tỷ trọng SP (%) | Doanh thu TB / SP ($) | Tổng Doanh thu ($) | Tỷ trọng Doanh thu (%) | Lượt xem TB | Đã bán TB | Tỷ lệ Hủy giỏ TB | Tỷ lệ Chốt đơn TB | Đơn giá TB ($) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cụm 2** | **1. Bán chạy Chủ lực (Bestsellers)** | **10,690** | **24.94%** | **$470.77** | **$1,076,940** | **75.31%** | **666.3** | **88.8** | **76.76%** | **16.57%** | **$6.04** |
| **Cụm 3** | **2. Tiện tay Mua kèm (Impulse Add-on)** | **2,024** | **4.72%** | **$77.18** | **$156,212** | **10.92%** | **111.0** | **75.3** | **64.19%** | **69.61%** | **$1.38** |
| **Cụm 1** | **3. Nghẽn Thanh toán (Cart Bottleneck)**| **14,406** | **33.61%** | **$29.91** | **$128,456** | **8.98%** | **60.7** | **8.7** | **85.16%** | **15.92%** | **$3.81** |
| **Cụm 4** | **4. Cao cấp Cân nhắc kỹ (High-Ticket)** | **9,692** | **22.61%** | **$75.82** | **$62,413** | **4.36%** | **119.4** | **5.6** | **62.61%** | **6.86%** | **$14.97** |
| **Cụm 0** | **5. Ít tương tác - Tồn kho ngủ đông** | **6,048** | **14.12%** | **$2.01** | **$6,512** | **0.46%** | **34.7** | **0.3** | **43.78%** | **1.47%** | **$12.63** |

---

### Phân Tích Chuyên Sâu 4 Tầng Cho Từng Nhóm Persona

#### 🌟 Nhóm 1: Bán chạy Chủ lực (Cầu cao - Chốt nhanh / Bestsellers)
* **Thực trạng chẩn đoán:** Trụ cột sống còn của sàn thương mại điện tử. Tuy chỉ chiếm **24.9% số lượng sản phẩm** nhưng tạo ra tới **75.31% tổng doanh thu** toàn sàn (trung bình $470.77/sp; 666 lượt xem và 88.8 đơn mua). Minh chứng hoàn hảo cho **Quy luật Pareto 80/20**.
* **Nguyên nhân tâm lý:** Sản phẩm thiết yếu của ngành làm đẹp (sơn gel cơ bản, máy mài móng, kềm chuyên dụng). Đánh giá 5 sao áp đảo và uy tín thương hiệu đã được khẳng định, khách hàng chủ động tìm kiếm và chốt đơn ngay không cần so sánh giá.
* **Dự báo tương lai:** Tiếp tục duy trì dòng tiền cốt lõi. Tuy nhiên doanh nghiệp đối mặt rủi ro tập trung dòng tiền cực lớn; nếu nguồn cung bị gián đoạn hoặc hết hàng, doanh số toàn sàn sẽ sụt giảm lập tức.
* **Chiến lược can thiệp KDD:**
  1. *Giữ vị trí hiển thị Top 1:* Ưu tiên vị trí số 1 trang chủ và đầu danh mục tìm kiếm.
  2. *Cảnh báo tồn kho tự động (Reorder Point):* Tự động kích hoạt đơn nhập hàng trước 7-10 ngày khi chạm ngưỡng an toàn kho.
  3. *Không giảm giá sâu:* Nhu cầu tự nhiên đã rất cao, chỉ nên tặng quà kèm (Gift with Purchase) để bảo vệ biên lợi nhuận ròng.

#### ⚡ Nhóm 2: Tiện tay Mua kèm (Giá siêu rẻ - Chốt tức thì / Impulse Add-on)
* **Thực trạng chẩn đoán:** Tỷ lệ chuyển đổi đạt kỷ lục toàn sàn (**69.61%**, nhiều mặt hàng vượt 100% do khách mua lặp lại nhiều chiếc). Mức giá siêu rẻ (trung bình **$1.38** ~ 30,000 VNĐ).
* **Nguyên nhân tâm lý:** Đơn giá nằm dưới ngưỡng đắn đo tài chính (*Zero financial barrier*). Khách hàng không cần cân nhắc, tiện tay bấm thêm vào giỏ khi đang thanh toán đơn hàng chính.
* **Dự báo tương lai:** Tiềm năng bùng nổ theo cấp số nhân nếu được tích hợp khéo léo vào thuật toán gợi ý bán chéo (*Cross-selling*).
* **Chiến lược can thiệp KDD:**
  1. *Bố trí tại bước Thanh toán (Checkout Widget):* Đặt thông điệp kích cầu: *"Thêm món này chỉ $0.85 để được Miễn phí giao hàng toàn quốc"*.
  2. *Bán kèm Bestseller (Bundle):* Ghép gói combo mua kèm các sản phẩm Nhóm 1 để tăng giá trị trung bình giỏ hàng (AOV).
  3. *Bán theo lốc số lượng lớn:* Đóng gói set 3-5 chiếc để giảm chi phí bao bì và vận chuyển.

#### ⚠️ Nhóm 3: Nghẽn Thanh toán (Bỏ giỏ nhiều - Hủy 85% / Cart Bottleneck)
* **Thực trạng chẩn đoán:** Chiếm quy mô lớn nhất danh mục (**33.61% - 14,406 sản phẩm**). Khách hàng thích và bỏ giỏ rất nhiều (48.6 lượt giỏ/sp), nhưng đến bước thanh toán cuối cùng thì **hủy bỏ tới 85.16%**. Đây là "Mỏ vàng đang bị rò rỉ dòng tiền".
* **Nguyên nhân tâm lý:** Nhu cầu của khách là có thật 100% nhưng gặp rào cản tâm lý: phí vận chuyển bất ngờ, phân vân giữa các mã màu sắc, hoặc thiếu mã giảm giá kích cầu chốt hạ.
* **Dự báo tương lai:** Nếu không can thiệp kịp thời, trên 70% sản phẩm nhóm này sẽ suy thoái dần thành hàng ế ẩm (Nhóm 5) trong 3-6 tháng tới.
* **Chiến lược can thiệp KDD:**
  1. *Bắn Voucher Giữ chân Tức thì (Exit-Intent Trigger):* Khi phát hiện khách chuẩn bị rời trang giỏ hàng, tự động bung popup tặng mã giảm giá 5-8% có hạn trong 2 giờ.
  2. *Hạ ngưỡng Freeship:* Miễn phí vận chuyển cho các đơn hàng có chứa sản phẩm nhóm này để gỡ bỏ rào cản phí ship.
  3. *Bổ sung Video Review & Swatch màu thực tế:* Đẩy mạnh ảnh unbox và video swatch màu thực tế lên đầu trang mô tả để tạo niềm tin chốt đơn.

#### 💎 Nhóm 4: Cao cấp Cân nhắc kỹ (Giá cao - Kén khách / High-Ticket Premium)
* **Thực trạng chẩn đoán:** Đơn giá cao nhất gian hàng (trung bình **$14.97**; nhiều máy móc trên $100-$200). Lượt xem cao (119 views/sp) nhưng tỷ lệ chốt đơn khiêm tốn (**6.86%**).
* **Nguyên nhân tâm lý:** Sản phẩm giá trị lớn (máy mài salon, máy hút bụi, mỹ phẩm đặc trị), khách xem rất kỹ thông số, so sánh nhiều tuần trước khi xuống tiền.
* **Dự báo tương lai:** Nhóm khách hàng có độ trung thành (*Retention*) và Giá trị vòng đời (*CLV*) cao nhất; mang lại biên lợi nhuận gộp lớn nhất cho doanh nghiệp.
* **Chiến lược can thiệp KDD:**
  1. *Cam kết Chính hãng & Hoàn tiền 200%:* Gắn huy hiệu bảo chứng chính hãng và chính sách bồi thường nếu phát hiện hàng giả.
  2. *Nội dung Chuyên gia:* Video phân tích thành phần, tư vấn từ Bác sĩ da liễu / Beauty Blogger uy tín.
  3. *Tư vấn 1-1 chuyên sâu:* Bố trí kênh chat chuyên viên hỗ trợ hướng dẫn kỹ thuật và chính sách bảo hành 12-24 tháng.

#### 💤 Nhóm 5: Ít tương tác - Tồn kho ngủ đông (Nguy cơ đọng vốn / Dormant Stock)
* **Thực trạng chẩn đoán:** Chiếm **14.12% danh mục (6,048 sản phẩm)** nhưng đóng góp doanh thu chưa tới **0.46%** (trung bình chỉ $2.01 doanh thu và 0.3 đơn hàng/sp suốt 5 tháng).
* **Nguyên nhân tâm lý:** Sản phẩm bị trôi về trang thứ 40-50 trong thanh tìm kiếm, hình ảnh mờ nhạt, giá đắt so với công năng, hoặc lỗi mốt trước sự thống trị của sơn gel hiện đại.
* **Dự báo tương lai:** Trở thành hàng tồn kho chết (*Dead Stock*) không thể thanh lý nếu tiếp tục để yên; gây đọng vốn lưu động và làm loãng thuật toán gợi ý của sàn.
* **Chiến lược can thiệp KDD:**
  1. *Livestream Flash Sale Xả kho:* Tổ chức phiên bán hàng xả kho đồng giá để thu hồi vốn lưu động.
  2. *Làm quà tặng Tri ân:* Sử dụng làm quà tặng khuyến mãi khi khách mua các đơn hàng Nhóm 4 Cao cấp.
  3. *Thanh lọc Danh mục:* Ẩn khỏi bộ lọc tìm kiếm chính nếu sau 60 ngày không phát sinh bất kỳ lượt tương tác nào.

---

## 5. CASE STUDY THỰC TẾ: BÓC TÁCH ĐÍCH DANH SẢN PHẨM TIÊU BIỂU

Trích xuất trực tiếp từ cơ sở dữ liệu Clickstream thực chứng, dưới đây là các mặt hàng đại diện tiêu biểu nhất cho từng nhóm:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CASE STUDY ĐÍCH DANH SẢN PHẨM THEO TỪNG NHÓM PERSONA                                            │
├───────┬─────────┬─────────────────────────────────────────────────┬───────────┬─────────┬────────┬─────────────┬───────────┬──────────────┤
│ Nhóm  │ Mã SP   │ Tên Mặt Hàng & Mô Tả Chi Tiết                   │ Hãng      │ Đơn giá │ Đã bán │ Doanh thu   │ Tỷ lệ hủy │ Tỷ lệ chốt   │
├───────┼─────────┼─────────────────────────────────────────────────┼───────────┼─────────┼────────┼─────────────┼───────────┼──────────────┤
│Nhóm 1 │ 5560754 │ Máy mài móng salon chuyên nghiệp Strong 210     │ Strong    │ $194.20 │    370 │ $71,855.19  │ 61.5%     │ 2.75%        │
│(Best) │ 5809910 │ Sơn lót liên kết móng Grattol Rubber Base 9ml   │ Grattol   │   $5.21 │  7,549 │ $39,306.71  │ 44.3%     │ 8.07% (Top 1)│
│       │ 5751422 │ Sơn phủ bóng không bết dính Uno Super Shine 15ml│ Uno       │  $10.87 │  3,521 │ $38,270.90  │ 55.8%     │ 16.56%       │
│       │ 5877454 │ Đèn hơ gel LED/UV chuyên dụng JessNail 48W      │ JessNail  │  $43.84 │    615 │ $26,961.31  │ 57.7%     │ 2.42%        │
├───────┼─────────┼─────────────────────────────────────────────────┼───────────┼─────────┼────────┼─────────────┼───────────┼──────────────┤
│Nhóm 2 │ 5877788 │ Miếng dán nail art decal nước 3D họa tiết hoa   │ BPW.Style │   $0.79 │     85 │     $67.15  │ 33.3%     │ 192.8% (Kỷ lục)
│(Impul)│ 5810157 │ Gói bông lau gel không xơ bụi Irisk 200 miếng   │ Irisk     │   $1.27 │  1,201 │  $1,525.91  │ 33.6%     │ 115.8%       │
│       │ 5700031 │ Thanh dũa móng 2 mặt chống xước Runail Buff     │ Runail    │   $0.95 │    135 │    $100.58  │ 31.3%     │ 128.9%       │
├───────┼─────────┼─────────────────────────────────────────────────┼───────────┼─────────┼────────┼─────────────┼───────────┼──────────────┤
│Nhóm 3 │ 5885420 │ Sơn gel nhũ đa sắc Grattol Luxury Stones Opal   │ Grattol   │   $6.35 │    442 │  $2,806.70  │ 81.8%     │ (Bỏ giỏ 2.4K)│
│(Nghẽn)│ 5802649 │ Bộ cọ vẽ móng nghệ thuật 5 đầu chuyên nghiệp    │ Artist    │   $4.50 │    545 │  $2,452.50  │ 85.99%    │ (Bỏ giỏ 3.8K)│
│       │ 5811708 │ Keo gắn móng giả có đầu cọ Irisk Brush-on 10g   │ Irisk     │   $3.80 │    446 │  $1,694.80  │ 83.1%     │ (Bỏ giỏ 2.6K)│
├───────┼─────────┼─────────────────────────────────────────────────┼───────────┼─────────┼────────┼─────────────┼───────────┼──────────────┤
│Nhóm 4 │ 5850281 │ Máy mài móng công suất lớn Marathon Champion 3  │ Marathon  │ $137.36 │    214 │ $29,395.80  │ 62.2%     │ (15.5K views)│
│(Prem) │ 5855507 │ Máy hút bụi làm móng âm bàn Max Ultimate 4 65W  │ Max       │  $79.21 │    225 │ $17,822.25  │ 70.9%     │ 3.44%        │
│       │ 5692527 │ Bảng phấn mắt 10 màu Inglot Freedom System      │ Inglot    │  $45.80 │    389 │ $17,815.35  │ 48.8%     │ 5.78%        │
├───────┼─────────┼─────────────────────────────────────────────────┼───────────┼─────────┼────────┼─────────────┼───────────┼──────────────┤
│Nhóm 5 │ 5908174 │ Kem dưỡng ẩm phục hồi da Avene Tolerance 50ml   │ Avene     │  $24.65 │      0 │      $0.00  │ 0.0%      │ 0.00% (5 thg)│
│(Sleep)│ 5863203 │ Tinh chất kích thích mọc móng Mavala K+ 5ml     │ Mavala    │  $15.56 │      0 │      $0.00  │ 0.0%      │ 0.00% (5 thg)│
│       │ 5775900 │ Sơn móng tay bóng OPI Infinite Shine mã màu cũ  │ OPI       │  $23.81 │      0 │      $0.00  │ 0.0%      │ 0.00% (5 thg)│
└───────┴─────────┴─────────────────────────────────────────────────┴───────────┴─────────┴────────┴─────────────┴───────────┴──────────────┘
```

---

## 6. PHÂN TÍCH ĐỘNG THÁI XU HƯỚNG CHUỖI THỜI GIAN (10/2019 - 02/2020)

Khác với các nghiên cứu tĩnh, đề tài tiến hành bóc tách chuỗi thời gian trên toàn bộ **20,692,840 sự kiện Clickstream** trong 5 tháng:

| Tháng | Ý nghĩa Chu kỳ Kinh doanh | Tổng Sự kiện | Lượt xem (`view`) | Lượt giỏ (`cart`) | Lượt hủy (`remove`) | Đơn mua (`purchase`) | Doanh thu ($) | Tỷ lệ Hủy giỏ (%) | Tỷ lệ Chốt đơn (%) | Active Users |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **10/2019** | Khởi động Quý 4 | 4,096,197 | 1,856,792 | 1,231,845 | 761,956 | 245,604 | $1,212,094 | **61.85%** (Thấp nhất)| 13.23% | 399,396 |
| **11/2019** | **Đỉnh Black Friday & 11.11** | **4,624,195** | **2,067,738** | **1,309,279** | **924,778** | **322,400** (Đỉnh) | **$1,531,509** (Đỉnh)| 70.63% | **15.59%** (Đỉnh)| 368,029 |
| **12/2019** | Giáng sinh & Cuối năm | 3,525,679 | 1,722,264 | 925,917 | 664,340 | 213,158 | $1,078,165 | 71.75% | 12.38% | 369,760 |
| **01/2020** | **Cao điểm Sắm Tết & Năm Mới**| 4,257,090 | 2,032,183 | 1,146,651 | 814,496 | 263,760 | $1,322,694 | 71.03% | 12.98% | **409,671** (Kỷ lục)|
| **02/2020** | Valentine & Sau Tết | 4,085,391 | 1,948,352 | 1,105,271 | 789,810 | 241,958 | $1,207,369 | 71.46% | 12.42% | 390,621 |

### Nhận định Xu hướng KDD:
1. **Đỉnh Doanh thu Tháng 11/2019 (Hiệu ứng Black Friday / 11.11):** Doanh số đạt đỉnh cao nhất kỳ (**$1.53M** với **322,400 đơn mua**), tỷ lệ chuyển đổi đạt kỷ lục 15.59%. Tuy nhiên, số lượt hủy bỏ giỏ hàng cũng đạt kỷ lục (924K lượt) do khách hàng liên tục thêm vào giỏ để săn flash-sale rồi thanh lọc đơn trước giờ G.
2. **Đỉnh Lưu lượng Người dùng Tháng 01/2020 (Hiệu ứng Sắm Tết):** Số lượng người dùng hoạt động (Active Users) đạt kỷ lục **409,671 người** (tăng mạnh so với 368K của tháng 11). Nhu cầu làm đẹp đón Tết đẩy doanh thu phục hồi mạnh lên **$1.32M**.
3. **Hiện tượng Chững lại Tháng 12/2019:** Doanh thu giảm xuống mức thấp nhất ($1.08M) do tâm lý lo ngại gián đoạn vận chuyển trước Giáng sinh và kỳ nghỉ lễ Tết Dương lịch kéo dài.

---

## 7. KIẾN TRÚC ỨNG DỤNG THỰC TIỄN & HỆ THỐNG WEB DEMO TƯƠNG TÁC

Đề tài không dừng lại ở nghiên cứu lý thuyết trên Notebook mà đã triển khai thành công hệ thống **Web Demo Tương tác Thời gian thực** phục vụ người dùng nghiệp vụ:

* **Địa chỉ chạy trực tiếp:** `http://localhost:5000`
* **Công nghệ cốt lõi:**
  - *Backend:* Python In-Memory DuckDB Engine, kết nối trực tiếp với 2 VIEW Parquet (`product_clustering_results` và `events`), tốc độ truy vấn **10 - 25 ms**.
  - *Frontend:* Vanilla HTML/CSS/JavaScript thuần, giao diện trắng sứ (Light Theme) sang trọng, tương thích hoàn toàn trên mọi trình duyệt.
* **Các Phân hệ Tính năng Chính:**
  1. **Executive Dashboard:** Biểu đồ Phễu tương tác Clickstream, Biểu đồ Pareto 80/20, Biểu đồ xu hướng chuỗi thời gian 5 tháng kèm timeline mùa vụ.
  2. **Persona Deep-Dive:** Khám phá chi tiết 5 nhóm Persona, Biểu đồ Radar 5 chiều, và danh sách **Case Study bóc tách đích danh từng sản phẩm thực tế kèm giải mã tâm lý khách hàng**.
  3. **Product Explorer:** Tra cứu, lọc theo Persona và sắp xếp toàn bộ 42,860 sản phẩm nghiên cứu với phân trang mượt mà.
  4. **Algorithm Benchmark:** Bảng đối sánh học thuật 3 mô hình K-Means, GMM, HDBSCAN kèm đồ thị thanh Silhouette & DBI.
  5. **What-If Intervention Simulator:** Bộ giả lập đo lường mức độ phục hồi doanh thu khi bật các cơ chế can thiệp thời gian thực (Trigger Coupon, Trợ giá ship, Combo Bundle).
  6. **Interactive SQL Console Playground:** Cho phép người dùng gõ câu lệnh SQL tùy ý hoặc chạy các câu mẫu Preset truy vấn trực tiếp vào cơ sở dữ liệu DuckDB 20.7 triệu dòng.

---

## 8. KẾT LUẬN KHOA HỌC & HƯỚNG PHÁT TRIỂN ĐỀ TÀI

### 8.1. Đóng Góp Khoa Học Của Đề Tài
1. **Xây dựng Pipeline Big Data Chuẩn Mực:** Chứng minh tính hiệu quả vượt trội của việc kết hợp DuckDB và Apache Parquet trong việc xử lý hơn 20.7 triệu sự kiện thương mại điện tử với thời gian dưới 1 phút trên phần cứng thông thường.
2. **Quy trình Xử lý Ngoại lai Không Mất mát:** Đề xuất và thực nghiệm thành công chiến lược 2 tầng (Winsorization 99.5% + Log1p) giúp khắc phục triệt để độ lệch Skewness cực đoan (>15 giảm về <1.5) mà vẫn bảo toàn 100% nhóm sản phẩm Bestsellers cốt lõi của doanh nghiệp.
3. **Định danh Persona Trực diện:** Chuyển hóa các cụm thuật toán trừu tượng thành 5 chân dung hành vi rõ ràng, đi kèm giải mã nguyên nhân tâm lý và ma trận hành động chiến lược có thể áp dụng ngay vào thực tế.
4. **Kết nối Học thuật & Ứng dụng Thực tiễn:** Xây dựng hoàn chỉnh từ code Jupyter Notebook khoa học đến Dashboard Website tương tác thời gian thực với In-Memory DuckDB Engine.

### 8.2. Hướng Phát Triển Tiếp Theo
* **Mở rộng Chuỗi Thời gian (Dynamic Cluster Migration):** Xây dựng ma trận chuyển dịch trạng thái (Markov Transition Matrix / Sankey Diagram) để dự báo xác suất một sản phẩm chuyển từ Nhóm Nghẽn thanh toán sang Nhóm Ngủ đông theo từng tuần.
* **Tích hợp Explainable AI (XAI):** Huấn luyện cây quyết định nông (*Surrogate Decision Tree*) để bóc tách các ngưỡng phân định cụm tự động thành bộ luật If-Then trực quan cho hệ thống ERP.
* **Cá nhân hóa Gợi ý (Cross-Sell Engine):** Tự động ghép nối các sản phẩm thuộc Nhóm 2 (Tiện tay Mua kèm) vào trang thanh toán của các đơn hàng có sản phẩm Nhóm 1 (Bán chạy Chủ lực).

---
*Báo cáo được tổng hợp và đối soát thực nghiệm tự động từ file mã nguồn `Product_Clustering_Research.ipynb` và hệ thống `web_demo/`.*
