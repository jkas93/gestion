import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsOptional, validateSync } from 'class-validator';

export class EnvironmentVariables {
    @IsNumber()
    @IsOptional()
    PORT?: number;

    @IsString()
    @IsNotEmpty()
    FIREBASE_PROJECT_ID: string;

    @IsString()
    @IsNotEmpty()
    FIREBASE_CLIENT_EMAIL: string;

    @IsString()
    @IsNotEmpty()
    FIREBASE_PRIVATE_KEY: string;

    @IsString()
    @IsNotEmpty()
    SMTP_HOST: string;

    @IsNumber()
    @IsOptional()
    SMTP_PORT?: number;

    @IsString()
    @IsNotEmpty()
    SMTP_USER: string;

    @IsString()
    @IsNotEmpty()
    SMTP_PASS: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );

    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        const errorMessages = errors.map(error => {
            const constraints = error.constraints ? Object.values(error.constraints) : [];
            return `❌ ${error.property}: ${constraints.join(', ')}`;
        }).join('\n');

        throw new Error(`❌ Error de validación de variables de entorno:\n${errorMessages}\n\n📝 Verifica tu archivo .env y asegúrate de que todas las variables estén configuradas correctamente.`);
    }

    return validatedConfig;
}
