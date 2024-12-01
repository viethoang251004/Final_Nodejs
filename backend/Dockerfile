# Sử dụng Node.js làm base image
FROM node:18

# Tạo thư mục ứng dụng
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json trước
COPY package*.json ./

# Cài đặt dependencies và build lại bcrypt
RUN npm install --build-from-source bcrypt

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Khai báo cổng
EXPOSE 8080

# Chạy ứng dụng
CMD ["node", "index.js"]
