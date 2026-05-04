# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copiar el archivo pom.xml y descargar dependencias
COPY pom.xml .
# RUN mvn dependency:go-offline -B # Opcional: para cachear dependencias si no cambian

# Copiar el código fuente
COPY src ./src

# Compilar el proyecto y empaquetarlo omitiendo los tests
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar el archivo .jar compilado desde la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Exponer el puerto de la aplicación (por defecto 8080)
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
