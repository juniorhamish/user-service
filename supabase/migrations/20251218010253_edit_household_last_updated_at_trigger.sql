create extension if not exists moddatetime schema user_service;
create trigger handle_updated_at
    before update
    on user_service.households
    for each row
execute procedure user_service.moddatetime(updated_at);
