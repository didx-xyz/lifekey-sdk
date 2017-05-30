
# lifekey-sdk

## registering

run the tests first with `npm test`, and then get your user id and private key by providing your email, nickname, and webhook uri parts.

```bash
./bin/register '{
  "email": "name@example.com",
  "nickname": "example-bot",
  "webhook_scheme": "https://",
  "webhook_hostname": "example.com",
  "webhook_port": 80,
  "webhook_path": "/my-hook"
}' > ~/example-bot.json
```

you, alone, are responsible for your user id and private key (which have to be included when initialising your host) no provisions have been made for managing secrets, here.

## events

name | data
---- | ----
`get_actions` | `{did}, bound return_actions function`
`user_connection_request` | `{ucr_id, from_did}`
`user_connection_created` | `{uc_id, to_id, from_did}`
`user_connection_deleted` | `{uc_id}`
`information_sharing_agreement_request` | `{from_did, isar_id}`
`information_sharing_agreement_request_rejected` | `{isar_id}`
`information_sharing_agreement_request_accepted` | `{isa_id}`
`information_sharing_agreement_deleted` | `{isa_id}`
`information_sharing_agreement_updated` | `{isa_id}`
`resource_pushed` | `{isa_id, resource_ids}`
`sent_activation_email` | `{}`
`app_activation_link_clicked` | `{}`
`received_did` | `{did_value, did_address}`
`received_thanks` | `{amount, reason, from_did}`
`user_message_received` | `{from_did, message}`
`isa_ledgered` | `{isa_id, txid}`