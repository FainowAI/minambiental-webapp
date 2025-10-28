-- Atualizar trigger para detectar origem do usuário e evitar duplicação
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_perfil TEXT;
    user_nome TEXT;
    user_cpf TEXT;
    user_celular TEXT;
    user_source TEXT;
BEGIN
    -- Get the perfil and source from metadata
    user_perfil := COALESCE(NEW.raw_user_meta_data->>'perfil', 'corpo_tecnico');
    user_nome := NEW.raw_user_meta_data->>'nome';
    user_cpf := NEW.raw_user_meta_data->>'cpf';
    user_celular := NEW.raw_user_meta_data->>'celular';
    user_source := NEW.raw_user_meta_data->>'source';
    
    -- Only proceed if we have the required data
    IF user_nome IS NOT NULL AND user_cpf IS NOT NULL THEN
        -- Insert profile
        INSERT INTO public.profiles (id, nome, cpf, celular)
        VALUES (NEW.id, user_nome, user_cpf, user_celular)
        ON CONFLICT (id) DO UPDATE SET
            nome = EXCLUDED.nome,
            cpf = EXCLUDED.cpf,
            celular = EXCLUDED.celular;
        
        -- Assign default role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, COALESCE((user_perfil)::app_role, 'user'))
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Only insert into usuarios if NOT created by admin
        -- Admin flow handles usuarios insertion in the edge function
        IF user_source IS NULL OR user_source != 'admin' THEN
            INSERT INTO public.usuarios (
                auth_user_id,
                nome,
                email,
                cpf,
                celular,
                perfil,
                status_aprovacao,
                created_at,
                updated_at
            )
            VALUES (
                NEW.id,
                user_nome,
                NEW.email,
                user_cpf,
                user_celular,
                user_perfil,
                CASE 
                    WHEN user_perfil = 'corpo_tecnico' THEN 'Pendente'
                    ELSE NULL
                END,
                NOW(),
                NOW()
            )
            ON CONFLICT (auth_user_id) DO UPDATE SET
                nome = EXCLUDED.nome,
                email = EXCLUDED.email,
                cpf = EXCLUDED.cpf,
                celular = EXCLUDED.celular,
                perfil = EXCLUDED.perfil,
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$function$;